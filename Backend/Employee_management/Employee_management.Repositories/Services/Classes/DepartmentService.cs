
using Employee_management.Api.Data;
using Employee_management.Interfaces.Interfaces;
using Employee_management.Shared;
using Employee_management.Shared.Dto;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Threading.Tasks;

namespace Employee_management.Repositories.Services.Classes
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
                    Description = d.Description,
                    IsActive = d.IsActive
                })
                .ToListAsync();
        }

        public async Task<bool> CreateDepartmentAsync(DepartmentDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
                return false;

            var exists = await _context.Departments.AnyAsync(d => d.Name.ToLower() == dto.Name.Trim().ToLower());
            if (exists)
                return false;

            var department = new Department
            {
                Name = dto.Name.Trim(),
                Description = dto.Description?.Trim(),
                IsActive = dto.IsActive
            };

            _context.Departments.Add(department);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UpdateDepartmentAsync(DepartmentDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
                return false;

            var department = await _context.Departments.FindAsync(dto.Id);
            if (department == null) return false;

            var exists = await _context.Departments.AnyAsync(d =>
                d.Name.ToLower() == dto.Name.Trim().ToLower() && d.Id != dto.Id);
            if (exists)
                return false;

            department.Name = dto.Name.Trim();
            department.Description = dto.Description?.Trim();
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

        public async Task<bool> DeleteDepartmentAsync(int id)
        {
            var department = await _context.Departments
                .Include(d => d.Employees)
                .FirstOrDefaultAsync(d => d.Id == id);

            if (department == null)
                return false;

            if (department.Employees?.Any() == true)
                return false;

            _context.Departments.Remove(department);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<PagedResponseDto<DepartmentDto>> GetDepartmentsPaginatedAsync(PaginationRequestDto request)
        {
            var query = _context.Departments.AsQueryable();

            if (!string.IsNullOrWhiteSpace(request.SearchTerm))
            {
                var term = request.SearchTerm.Trim().ToLower();
                query = query.Where(d =>
                    d.Name.ToLower().Contains(term) ||
                    (d.Description != null && d.Description.ToLower().Contains(term)));
            }

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

            var totalCount = await query.CountAsync();

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
                Draw = request.Draw,
                Items = items,
                TotalCount = totalCount,
                CurrentPage = request.Page,
                PageSize = request.PageSize,
                TotalPages = (int)System.Math.Ceiling(totalCount / (double)request.PageSize)
            };
        }
    }
}