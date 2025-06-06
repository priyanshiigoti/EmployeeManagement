using Employee_management.Api.Data;
using Employee_management.Interfaces.Interfaces;
using Employee_management.Shared;
using Employee_management.Shared.Dto;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Threading.Tasks;

namespace Employee_management.Api.Services.Classes
{
    public class DepartmentService : IDepartmentService
    {
        private readonly ApplicationDbContext _context;

        public DepartmentService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<DepartmentDto>> GetAllDepartmentsAsync()
        {
            return await _context.Departments
                .Select(d => new DepartmentDto
                {
                    Id = d.Id,
                    Name = d.Name,
                    Description = d.Description,  // Map Description
                    IsActive = d.IsActive
                }).ToListAsync();
        }


        public async Task<bool> CreateDepartmentAsync(DepartmentDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
                return false;

            var exists = await _context.Departments.AnyAsync(d => d.Name == dto.Name);
            if (exists)
                return false;

            var department = new Department
            {
                Name = dto.Name,
                Description = dto.Description,
                IsActive = dto.IsActive
            };
            _context.Departments.Add(department);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UpdateDepartmentAsync(DepartmentDto dto)
        {
            var department = await _context.Departments.FindAsync(dto.Id);
            if (department == null) return false;

            // Check for duplicate names (excluding current department)
            if (await _context.Departments.AnyAsync(d =>
                d.Name == dto.Name && d.Id != dto.Id))
            {
                return false;
            }

            department.Name = dto.Name;
            department.Description = dto.Description;
            department.IsActive = dto.IsActive;

            try
            {
                await _context.SaveChangesAsync();
                return true;
            }
            catch (DbUpdateException)
            {
                return false;
            }
        }

        public enum DeleteResult
        {
            Success,
            NotFound,
            HasEmployees
        }

        public async Task<DeleteResult> DeleteDepartmentAsync(int id)
        {
            var department = await _context.Departments
                .Include(d => d.Employees)
                .FirstOrDefaultAsync(d => d.Id == id);

            if (department == null)
                return DeleteResult.NotFound;

            // Prevent deletion if department has employees
            if (department.Employees?.Any() == true)
                return DeleteResult.HasEmployees;

            _context.Departments.Remove(department);
            await _context.SaveChangesAsync();
            return DeleteResult.Success;
        }

        public async Task<PagedResponseDto<DepartmentDto>> GetDepartmentsPaginatedAsync(PaginationRequestDto request)
        {
            var query = _context.Departments.AsQueryable();

            // Apply search filter
            if (!string.IsNullOrWhiteSpace(request.SearchTerm))
            {
                query = query.Where(d =>
                    d.Name.Contains(request.SearchTerm) ||
                    (d.Description != null && d.Description.Contains(request.SearchTerm)));
            }

            // Apply sorting
            var sortProperty = request.SortColumn ?? "Name";
            var sortDirection = request.SortDirection?.ToLower() == "desc"
                ? ListSortDirection.Descending
                : ListSortDirection.Ascending;

            query = sortProperty switch
            {
                "Name" => sortDirection == ListSortDirection.Ascending
                    ? query.OrderBy(d => d.Name)
                    : query.OrderByDescending(d => d.Name),
                "Description" => sortDirection == ListSortDirection.Ascending
                    ? query.OrderBy(d => d.Description)
                    : query.OrderByDescending(d => d.Description),
                "IsActive" => sortDirection == ListSortDirection.Ascending
                    ? query.OrderBy(d => d.IsActive)
                    : query.OrderByDescending(d => d.IsActive),
                _ => query.OrderBy(d => d.Name)
            };

            // Get total count
            var totalCount = await query.CountAsync();

            // Apply pagination
            var items = await query
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .Select(d => new DepartmentDto
                {
                    Id = d.Id,
                    Name = d.Name,
                    Description = d.Description,
                    IsActive = d.IsActive
                })
                .ToListAsync();

            return new PagedResponseDto<DepartmentDto>
            {
                Items = items,
                TotalCount = totalCount,
                CurrentPage = request.Page,
                PageSize = request.PageSize,
                TotalPages = (int)Math.Ceiling(totalCount / (double)request.PageSize)
            };
        }

        Task IDepartmentService.DeleteDepartmentAsync(int id)
        {
            return DeleteDepartmentAsync(id);
        }
    }
}
