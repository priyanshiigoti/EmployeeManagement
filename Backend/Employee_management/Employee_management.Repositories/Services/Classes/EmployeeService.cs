﻿using Azure.Core;
using Employee_management.Api.Data;
using Employee_management.Interfaces.Interfaces;
using Employee_management.Shared;
using Employee_management.Shared.Dto;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

using System.Threading.Tasks;

namespace Employee_management.Repositories.Services.Classes
{
    public class EmployeeService : IEmployeeService
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly ILogger<EmployeeService> _logger;
        private readonly IWebHostEnvironment _env;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public EmployeeService(
            ApplicationDbContext context,
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole> roleManager,
            ILogger<EmployeeService> logger, 
            IWebHostEnvironment env,
                IHttpContextAccessor httpContextAccessor) // <-- Add this


        {
            _context = context;
            _userManager = userManager;
            _roleManager = roleManager;
            _logger = logger;
            _env = env;
            _httpContextAccessor = httpContextAccessor; // <-- Assign it
  
        }

        public async Task<PagedResponseDto<EmployeeDto>> GetEmployeesPaginatedAsync(PaginationRequestDto request, string? currentUserId, bool isAdmin)
        {
            var query = _context.Employees
                .Include(e => e.User)
                .Include(e => e.Department)
                .AsQueryable();

            // Role-based filtering
            if (!isAdmin && currentUserId != null)
            {
                var deptId = await GetDepartmentIdByUserIdAsync(currentUserId);
                if (deptId == null)
                    return new PagedResponseDto<EmployeeDto>
                    {
                        Items = new List<EmployeeDto>(),
                        TotalCount = 0,
                        CurrentPage = request.Page,
                        PageSize = request.PageSize,
                        TotalPages = 0,
                        Draw = request.Draw
                    };

                query = query.Where(e => e.DepartmentId == deptId.Value);
            }

            // Exclude Admin and Manager users
            var adminUsers = await _userManager.GetUsersInRoleAsync("Admin");
            var managerUsers = await _userManager.GetUsersInRoleAsync("Manager");
            var excludeIds = adminUsers.Select(u => u.Id)
                                .Union(managerUsers.Select(u => u.Id))
                                .ToList();
            query = query.Where(e => e.User != null && !excludeIds.Contains(e.UserId));

            // Searching
            if (!string.IsNullOrWhiteSpace(request.SearchTerm))
            {
                query = query.Where(e =>
                    e.User.FirstName.Contains(request.SearchTerm) ||
                    e.User.LastName.Contains(request.SearchTerm) ||
                    e.User.Email.Contains(request.SearchTerm) ||
                    e.Department.Name.Contains(request.SearchTerm));
            }

            // Sorting
            var sortColumn = request.SortColumn ?? "FirstName";
            var sortDir = request.SortDirection?.ToLower() == "desc" ? "desc" : "asc";

            query = (sortColumn, sortDir) switch
            {
                ("FirstName", "asc") => query.OrderBy(e => e.User.FirstName),
                ("FirstName", "desc") => query.OrderByDescending(e => e.User.FirstName),
                ("Email", "asc") => query.OrderBy(e => e.User.Email),
                ("Email", "desc") => query.OrderByDescending(e => e.User.Email),
                ("Department", "asc") => query.OrderBy(e => e.Department.Name),
                ("Department", "desc") => query.OrderByDescending(e => e.Department.Name),
                ("IsActive", "asc") => query.OrderBy(e => e.IsActive),
                ("IsActive", "desc") => query.OrderByDescending(e => e.IsActive),
                _ => query.OrderBy(e => e.User.FirstName)
            };

            // Pagination
            var totalCount = await query.CountAsync();
            var items = await query
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .Select(e => new EmployeeDto
                {
                    Id = e.Id,
                    UserId = e.UserId,
                    FirstName = e.User.FirstName,
                    LastName = e.User.LastName,
                    Email = e.User.Email,
                    PhoneNumber = e.User.PhoneNumber,
                    DepartmentId = e.DepartmentId,
                    DepartmentName = e.Department != null ? e.Department.Name : null,
                    IsActive = e.IsActive,
                    ProfileImagePath = e.User.ProfileImagePath // Add this line

                })
                .ToListAsync();

            return new PagedResponseDto<EmployeeDto>
            {
                Draw = request.Draw,
                Items = items,
                TotalCount = totalCount,
                CurrentPage = request.Page,
                PageSize = request.PageSize,
                TotalPages = (int)Math.Ceiling(totalCount / (double)request.PageSize)
            };
        }


        public async Task<IEnumerable<EmployeeDto>> GetAssignableEmployeesAsync()
        {
            return await _context.Employees
                .Include(e => e.User)
                .Select(e => new EmployeeDto
                {
                    Id = e.Id,
                    FirstName = e.User.FirstName,
                    LastName = e.User.LastName
                })
                .ToListAsync();
        }

        public async Task<IEnumerable<EmployeeDto>> GetEmployeesByRoleAsync(string roleName)
        {
            var usersInRole = await _userManager.GetUsersInRoleAsync(roleName);
            var userIds = usersInRole.Select(u => u.Id).ToList();

            return await _context.Employees
                .Include(e => e.User)
                .Include(e => e.Department)
                .Where(e => userIds.Contains(e.UserId))
                .Select(e => new EmployeeDto
                {
                    Id = e.Id,
                    UserId = e.UserId,
                    FirstName = e.User.FirstName,
                    LastName = e.User.LastName,
                    Email = e.User.Email,
                    PhoneNumber = e.User.PhoneNumber,
                    DepartmentName = e.Department.Name,
                    DepartmentId = e.DepartmentId,
                    IsActive = e.IsActive
                })
                .ToListAsync();
        }

       


        public async Task<EmployeeDto> GetByIdAsync(int id)
        {
            var employee = await _context.Employees
                .Include(e => e.User)
                .Include(e => e.Department)
                .FirstOrDefaultAsync(e => e.Id == id);

            return employee == null ? null : new EmployeeDto
            {
                Id = employee.Id,
                UserId = employee.UserId,
                FirstName = employee.User.FirstName,
                LastName = employee.User.LastName,
                Email = employee.User.Email,
                PhoneNumber = employee.User.PhoneNumber,
                DepartmentId = employee.DepartmentId,
                DepartmentName = employee.Department.Name,
                IsActive = employee.IsActive,
                ProfileImagePath = employee.User.ProfileImagePath // Add this line

            };
        }

        public async Task<bool> CreateAsync(EmployeeDto dto)
        {
            var existingUser = await _userManager.FindByEmailAsync(dto.Email);
            ApplicationUser user;

            if (existingUser != null)
            {
                user = existingUser;
            }
            else
            {
                user = new ApplicationUser
                {
                    UserName = dto.Email,
                    Email = dto.Email,
                    PhoneNumber = dto.PhoneNumber,
                    FirstName = dto.FirstName,
                    LastName = dto.LastName
                };

                var createResult = await _userManager.CreateAsync(user, "DefaultPassword1!");
                if (!createResult.Succeeded)
                {
                    _logger.LogError("User creation failed: {Errors}",
                        string.Join(", ", createResult.Errors.Select(e => e.Description)));
                    return false;
                }
            }

            // Assign Employee role
            if (!await _userManager.IsInRoleAsync(user, "Employee"))
            {
                var roleResult = await _userManager.AddToRoleAsync(user, "Employee");
                if (!roleResult.Succeeded)
                {
                    _logger.LogError("Role assignment failed: {Errors}",
                        string.Join(", ", roleResult.Errors.Select(e => e.Description)));
                    return false;
                }
            }

            var employee = new Employee
            {
                UserId = user.Id,
                DepartmentId = dto.DepartmentId,
                IsActive = dto.IsActive,
                HireDate = DateTime.UtcNow
            };

            _context.Employees.Add(employee);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<(bool Success, string ErrorMessage)> CreateManagerAsync(CreateManagerDto dto)
        {
            var existingUser = await _userManager.FindByEmailAsync(dto.Email);
            if (existingUser != null)
                return (false, "User with this email already exists.");

            var user = new ApplicationUser
            {
                UserName = dto.Email,
                Email = dto.Email,
                PhoneNumber = dto.PhoneNumber,
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                ProfileImagePath = dto.ProfileImagePath // Add this line

            };

            var createUserResult = await _userManager.CreateAsync(user, dto.Password);
            if (!createUserResult.Succeeded)
            {
                var errors = string.Join("; ", createUserResult.Errors.Select(e => e.Description));
                return (false, errors);
            }

            var addRoleResult = await _userManager.AddToRoleAsync(user, "Manager");
            if (!addRoleResult.Succeeded)
            {
                await _userManager.DeleteAsync(user);
                var errors = string.Join("; ", addRoleResult.Errors.Select(e => e.Description));
                return (false, errors);
            }

            var employee = new Employee
            {
                UserId = user.Id,
                DepartmentId = dto.DepartmentId,  // This will work with nullable int
                IsActive = dto.IsActive,
                HireDate = DateTime.UtcNow
            };

            _context.Employees.Add(employee);
            await _context.SaveChangesAsync();

            return (true, null);
        }

        public async Task<IEnumerable<DepartmentDto>> GetActiveDepartmentsAsync()
        {
            return await _context.Departments
                .Where(d => d.IsActive)
                .Select(d => new DepartmentDto
                {
                    Id = d.Id,
                    Name = d.Name,
                    Description = d.Description,
                    IsActive = d.IsActive
                }).ToListAsync();
        }

        public async Task<bool> UpdateAsync(EmployeeDto dto)
        {
            var employee = await _context.Employees
                .Include(e => e.User)
                .FirstOrDefaultAsync(e => e.Id == dto.Id);

            if (employee == null || employee.User == null) return false;

            var user = await _userManager.FindByIdAsync(employee.UserId);
            if (user == null) return false;

            user.FirstName = dto.FirstName ?? user.FirstName;
            user.LastName = dto.LastName ?? user.LastName;
            user.PhoneNumber = dto.PhoneNumber ?? user.PhoneNumber;

            if (!string.IsNullOrEmpty(dto.Email) && user.Email != dto.Email)
            {
                user.Email = dto.Email;
                user.UserName = dto.Email;
                user.NormalizedEmail = _userManager.NormalizeEmail(dto.Email);
                user.NormalizedUserName = _userManager.NormalizeName(dto.Email);
            }

            employee.DepartmentId = dto.DepartmentId;
            employee.IsActive = dto.IsActive;

            await _userManager.UpdateAsync(user);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var employee = await _context.Employees
                .Include(e => e.User)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (employee == null) return false;

            var hasActiveTasks = await _context.Tasks.AnyAsync(t =>
                t.AssignedToId == employee.UserId &&
                (t.Status == "Pending" || t.Status == "InProgress"));

            if (hasActiveTasks)
            {
                throw new InvalidOperationException("Cannot delete employee with active (pending/in progress) tasks.");
            }

            if (employee.User != null)
                _context.Users.Remove(employee.User);

            _context.Employees.Remove(employee);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<CreateManagerDto> GetManagerByIdAsync(int id)
        {
            var employee = await _context.Employees
                .Include(e => e.User)
                .FirstOrDefaultAsync(e => e.Id == id);

            return employee == null ? null : new CreateManagerDto
            {
                FirstName = employee.User.FirstName,
                LastName = employee.User.LastName,
                Email = employee.User.Email,
                PhoneNumber = employee.User.PhoneNumber,
                DepartmentId = employee.DepartmentId
            };
        }

        public async Task<bool> UpdateManagerAsync(int id, UpdateManagerDto dto)
        {
            var employee = await _context.Employees
                .Include(e => e.User)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (employee == null)
                return false;

            employee.User.FirstName = dto.FirstName;
            employee.User.LastName = dto.LastName;
            employee.User.PhoneNumber = dto.PhoneNumber;
            employee.DepartmentId = dto.DepartmentId;
            employee.IsActive = dto.IsActive;

            if (!string.IsNullOrEmpty(dto.ProfileImagePath))
                employee.User.ProfileImagePath = dto.ProfileImagePath;

            await _context.SaveChangesAsync();
            return true;
        }


        public async Task<bool> DeleteManagerByUserIdAsync(string userId)
        {
            _logger.LogInformation($"Attempting to delete manager with UserId: {userId}");

            var managerEmployee = await _context.Employees
                .Include(e => e.User)
                .FirstOrDefaultAsync(e => e.UserId == userId);

            if (managerEmployee == null)
            {
                _logger.LogWarning($"Manager employee with UserId {userId} not found.");
                return false;
            }

            var managesEmployees = await _context.Employees.AnyAsync(e => e.ManagerId == userId);
            if (managesEmployees)
            {
                _logger.LogWarning($"Manager with UserId {userId} manages employees.");
                return false;
            }

            var hasAssignedTasks = await _context.Tasks.AnyAsync(t => t.AssignedToId == userId);
            if (hasAssignedTasks)
            {
                _logger.LogWarning($"UserId {userId} has assigned tasks and cannot be deleted.");
                return false;
            }

            if (managerEmployee.User != null)
                _context.Users.Remove(managerEmployee.User);

            _context.Employees.Remove(managerEmployee);

            await _context.SaveChangesAsync();
            _logger.LogInformation($"Successfully deleted manager with UserId {userId}.");

            return true;
        }

        public async Task<IEnumerable<EmployeeDto>> GetEmployeesByDepartmentAsync(int departmentId)
        {
            var employeeUserIds = (await _userManager.GetUsersInRoleAsync("Employee"))
                                  .Select(u => u.Id)
                                  .ToHashSet();

            return await _context.Employees
                .Include(e => e.User)
                .Include(e => e.Department)
                .Where(e => e.DepartmentId == departmentId && employeeUserIds.Contains(e.UserId))
                .Select(e => new EmployeeDto
                {
                    Id = e.Id,
                    UserId = e.UserId,
                    FirstName = e.User.FirstName,
                    LastName = e.User.LastName,
                    Email = e.User.Email,
                    PhoneNumber = e.User.PhoneNumber,
                    DepartmentName = e.Department.Name,
                    DepartmentId = e.DepartmentId,
                    IsActive = e.IsActive,

                })
                .ToListAsync();
        }

        public async Task<int?> GetDepartmentIdByUserIdAsync(string userId)
        {
            var employee = await _context.Employees
                .FirstOrDefaultAsync(e => e.UserId == userId);

            return employee?.DepartmentId;
        }

        public async Task<ApplicationUser> GetUserByIdAsync(string userId)
        {
            return await _userManager.FindByIdAsync(userId);
        }

        public async Task<string?> SaveProfileImageAsync(IFormFile? file)
        {
            if (file == null || file.Length == 0)
                return null;

            var folderPath = Path.Combine(_env.WebRootPath, "uploads", "managers");
            Directory.CreateDirectory(folderPath);

            var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
            var filePath = Path.Combine(folderPath, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Return relative path only, not full URL
            return Path.Combine("uploads", "managers", fileName).Replace("\\", "/");
        }


        public async Task<PagedResponseDto<CreateManagerDto>> GetManagersPaginatedAsync(PaginationRequestDto request)
        {
            // Get all user IDs of managers first (better approach)
            var managerUserIds = (await _userManager.GetUsersInRoleAsync("Manager")).Select(u => u.Id).ToHashSet();

            var query = _context.Employees
                .Include(e => e.User)
                .Include(e => e.Department) // Make sure to include Department
                .Where(e => managerUserIds.Contains(e.UserId))
                .AsQueryable();

            // Apply search filter
            if (!string.IsNullOrWhiteSpace(request.SearchTerm))
            {
                var searchTerm = request.SearchTerm.Trim().ToLower();
                query = query.Where(e =>
                    e.User.FirstName.ToLower().Contains(searchTerm) ||
                    e.User.LastName.ToLower().Contains(searchTerm) ||
                    e.User.Email.ToLower().Contains(searchTerm) ||
                    (e.Department != null && e.Department.Name.ToLower().Contains(searchTerm)));
            }

            // Get total count
            var totalCount = await query.CountAsync();

            // Calculate paging parameters
            int pageSize = request.PageSize > 0 ? request.PageSize : 10;
            int pageNumber = request.Page > 0 ? request.Page : 1;

            // Sorting
            bool ascending = request.SortDirection?.ToLower() == "asc";
            var sortColumn = request.SortColumn?.ToLower() ?? "firstname";

            query = (sortColumn, ascending) switch
            {
                ("firstname", true) => query.OrderBy(e => e.User.FirstName),
                ("firstname", false) => query.OrderByDescending(e => e.User.FirstName),
                ("lastname", true) => query.OrderBy(e => e.User.LastName),
                ("lastname", false) => query.OrderByDescending(e => e.User.LastName),
                ("email", true) => query.OrderBy(e => e.User.Email),
                ("email", false) => query.OrderByDescending(e => e.User.Email),
                ("department", true) => query.OrderBy(e => e.Department.Name),
                ("department", false) => query.OrderByDescending(e => e.Department.Name),
                _ => query.OrderBy(e => e.User.FirstName)
            };

            // Fetch paged data
            var pagedManagers = await query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(e => new CreateManagerDto
                {
                    Id = e.Id,
                    FirstName = e.User.FirstName,
                    LastName = e.User.LastName,
                    Email = e.User.Email,
                    PhoneNumber = e.User.PhoneNumber,
                    DepartmentId = e.DepartmentId,
                    DepartmentName = e.Department != null ? e.Department.Name : "Unassigned",
                    IsActive = e.IsActive,
                    ProfileImagePath = e.User.ProfileImagePath // Ensure this is included
                })
                .ToListAsync();

            // Return paged response DTO
            return new PagedResponseDto<CreateManagerDto>
            {
                Draw = request.Draw,
                CurrentPage = pageNumber,
                TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
                PageSize = pageSize,
                TotalCount = totalCount,
                Items = pagedManagers
            };
        }

      


    }
}
