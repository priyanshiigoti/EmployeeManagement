using Employee_management.Api.Data;
using Employee_management.Interfaces.Interfaces;
using Employee_management.Shared;
using Employee_management.Shared.Dto;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Employee_management.Repositories.Services.Classes
{
    public class TaskService : ITaskService
    {
        private readonly ApplicationDbContext _context;

        public TaskService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<TaskDto>> GetAllAsync(string userId, string role)
        {
            var query = _context.Tasks
                .Include(t => t.AssignedTo)
                .Include(t => t.CreatedBy)
                .AsQueryable();

            if (role == "Employee")
            {
                query = query.Where(t => t.AssignedToId == userId);
            }
            else if (role == "Manager")
            {
                var manager = await _context.Employees
                    .Include(e => e.Department)
                    .FirstOrDefaultAsync(e => e.UserId == userId);

                if (manager != null)
                {
                    var employeeIdsInDepartment = await _context.Employees
                        .Where(e => e.DepartmentId == manager.DepartmentId)
                        .Select(e => e.UserId)
                        .ToListAsync();

                    query = query.Where(t =>
                        employeeIdsInDepartment.Contains(t.AssignedToId) ||
                        t.CreatedById == userId
                    );
                }
            }

            // Materialize tasks and employees
            var taskList = await query.ToListAsync();

            var employees = await _context.Employees
                .Include(e => e.User)
                .Include(e => e.Department)
                .ToListAsync();

            // Map to DTOs in memory
            var taskDtos = taskList.Select(t => new TaskDto
            {
                Id = t.Id,
                Title = t.Title,
                Description = t.Description,
                DueDate = t.DueDate,
                Status = t.Status,
                AssignedUserId = t.AssignedToId,
                AssignedEmployeeName = employees
                    .Where(e => e.UserId == t.AssignedToId)
                    .Select(e => $"{e.User.FirstName} {e.User.LastName}")
                    .FirstOrDefault(),
                DepartmentId = employees
                    .Where(e => e.UserId == t.AssignedToId)
                    .Select(e => e.DepartmentId)
                    .FirstOrDefault()
            }).ToList();

            return taskDtos;
        }


        public async Task<TaskDto> GetByIdAsync(int id, string userId, string role)
        {
            var task = await _context.Tasks
                .Include(t => t.AssignedTo)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (task == null)
                return null;

            if (role == "Employee" && task.AssignedToId != userId)
                return null;

            if (role == "Manager")
            {
                var manager = await _context.Employees
                    .FirstOrDefaultAsync(e => e.UserId == userId);

                var assignedEmp = await _context.Employees
                    .FirstOrDefaultAsync(e => e.UserId == task.AssignedToId);

                if (manager == null || assignedEmp == null || assignedEmp.DepartmentId != manager.DepartmentId)
                    return null;
            }

            var emp = await _context.Employees
                .Include(e => e.Department)
                .FirstOrDefaultAsync(e => e.UserId == task.AssignedToId);

            return new TaskDto
            {
                Id = task.Id,
                Title = task.Title,
                Description = task.Description,
                DueDate = task.DueDate,
                Status = task.Status,
                AssignedUserId = task.AssignedToId,
                DepartmentId = emp?.DepartmentId ?? 0
            };
        }

        public async Task<(bool Success, string Error)> CreateAsync(TaskDto dto, string userId, string role)
        {
            if (role == "Employee")
                return (false, "You are not authorized to create tasks");

            var manager = await _context.Employees.FirstOrDefaultAsync(e => e.UserId == userId);
            if (manager == null)
                return (false, "Manager not found");

            var assignedEmp = await _context.Employees.FirstOrDefaultAsync(e => e.UserId == dto.AssignedUserId);
            if (assignedEmp == null)
                return (false, "Assigned employee not found");

            if (assignedEmp.DepartmentId != manager.DepartmentId)
                return (false, "Can assign tasks only within your department");

            var task = new TaskItem
            {
                Title = dto.Title,
                Description = dto.Description,
                DueDate = dto.DueDate,
                Status = dto.Status,
                AssignedToId = dto.AssignedUserId,
                CreatedById = userId
            };

            _context.Tasks.Add(task);
            await _context.SaveChangesAsync();
            return (true, null);
        }

        // Update the UpdateAsync method with these changes
        public async Task<(bool Success, string Error)> UpdateAsync(TaskDto dto, string userId, string role)
        {
            var task = await _context.Tasks
                .FirstOrDefaultAsync(t => t.Id == dto.Id);

            if (task == null)
                return (false, "Task not found");

            // Admin bypasses all checks
            if (role != "Admin")
            {
                if (role == "Employee")
                {
                    // Employees can only update their own tasks
                    if (task.AssignedToId != userId)
                        return (false, "Unauthorized to update this task");

                    // Employees can only modify status
                    task.Status = dto.Status;
                    await _context.SaveChangesAsync();
                    return (true, null);
                }

                if (role == "Manager")
                {
                    var manager = await _context.Employees
                        .FirstOrDefaultAsync(e => e.UserId == userId);

                    if (manager == null)
                        return (false, "Manager not found");

                    // Check if task is in manager's department
                    var assignedEmp = await _context.Employees
                        .FirstOrDefaultAsync(e => e.UserId == task.AssignedToId);

                    if (assignedEmp == null || assignedEmp.DepartmentId != manager.DepartmentId)
                        return (false, "Not authorized for this task");
                }
            }

            // Update all fields for managers/admins
            task.Title = dto.Title;
            task.Description = dto.Description;
            task.DueDate = dto.DueDate;
            task.Status = dto.Status;
            task.AssignedToId = dto.AssignedUserId;

            await _context.SaveChangesAsync();
            return (true, null);
        }

        // Update the DeleteAsync method with these changes
        public async Task<bool> DeleteAsync(int id, string userId, string role)
        {
            var task = await _context.Tasks
                .FirstOrDefaultAsync(t => t.Id == id);

            if (task == null)
                return false;

            // Admin bypasses all checks
            if (role == "Manager")
            {
                _context.Tasks.Remove(task);
                await _context.SaveChangesAsync();

            }

            return true;
        }

        public async Task<IEnumerable<EmployeeDropdownDto>> GetEmployeesAsync(string userId, string role)
        {
            if (role == "Employee")
            {
                return new List<EmployeeDropdownDto>();
            }

            // Get the Role Id for "Employee"
            var employeeRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "Employee");
            if (employeeRole == null)
            {
                // No Employee role found, return empty
                return new List<EmployeeDropdownDto>();
            }

            // Get userIds of employees with "Employee" role
            var employeeUserIds = await _context.UserRoles
                .Where(ur => ur.RoleId == employeeRole.Id)
                .Select(ur => ur.UserId)
                .ToListAsync();

            var query = _context.Employees
                .Include(e => e.User)
                .Include(e => e.Department)
                .Where(e => e.IsActive && employeeUserIds.Contains(e.UserId))
                .AsQueryable();

            if (role == "Manager")
            {
                var manager = await _context.Employees
                    .FirstOrDefaultAsync(e => e.UserId == userId);

                if (manager != null && manager.DepartmentId.HasValue)
                {
                    query = query.Where(e => e.DepartmentId == manager.DepartmentId);
                }
            }

            return await query
                .OrderBy(e => e.User.FirstName)
                .ThenBy(e => e.User.LastName)
                .Select(e => new EmployeeDropdownDto
                {
                    Id = e.Id,
                    UserId = e.UserId,
                    FirstName = e.User.FirstName,
                    LastName = e.User.LastName,
                    FullName = e.User.FirstName + " " + e.User.LastName,
                    DepartmentName = e.Department != null ? e.Department.Name : "No Department"
                })
                .ToListAsync();
        }

        public async Task<PagedResponseDto<TaskDto>> GetPagedAsync(string userId, string role, PaginationRequestDto request)
        {
            var query = _context.Tasks
                .Include(t => t.AssignedTo)
                .Include(t => t.CreatedBy)
                .AsQueryable();

            if (role == "Employee")
            {
                query = query.Where(t => t.AssignedToId == userId);
            }
            else if (role == "Manager")
            {
                var manager = await _context.Employees
                    .Include(e => e.Department)
                    .FirstOrDefaultAsync(e => e.UserId == userId);

                if (manager != null)
                {
                    var employeeIds = await _context.Employees
                        .Where(e => e.DepartmentId == manager.DepartmentId)
                        .Select(e => e.UserId)
                        .ToListAsync();

                    query = query.Where(t => employeeIds.Contains(t.AssignedToId) || t.CreatedById == userId);
                }
            }

            if (!string.IsNullOrWhiteSpace(request.SearchTerm))
            {
                query = query.Where(t =>
                    t.Title.Contains(request.SearchTerm) ||
                    t.Description.Contains(request.SearchTerm));
            }

            switch (request.SortColumn?.ToLower())
            {
                case "title":
                    query = request.SortDirection == "desc" ? query.OrderByDescending(t => t.Title) : query.OrderBy(t => t.Title);
                    break;
                case "duedate":
                    query = request.SortDirection == "desc" ? query.OrderByDescending(t => t.DueDate) : query.OrderBy(t => t.DueDate);
                    break;
                case "status":
                    query = request.SortDirection == "desc" ? query.OrderByDescending(t => t.Status) : query.OrderBy(t => t.Status);
                    break;
                default:
                    query = query.OrderBy(t => t.Title); // Default sort
                    break;
            }

            var totalCount = await query.CountAsync();

            var items = await query
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync();

            var employees = await _context.Employees
                .Include(e => e.User)
                .Include(e => e.Department)
                .ToListAsync();

            var taskDtos = items.Select(t => new TaskDto
            {
                Id = t.Id,
                Title = t.Title,
                Description = t.Description,
                DueDate = t.DueDate,
                Status = t.Status,
                AssignedUserId = t.AssignedToId,
                AssignedEmployeeName = employees
                    .Where(e => e.UserId == t.AssignedToId)
                    .Select(e => $"{e.User.FirstName} {e.User.LastName}")
                    .FirstOrDefault(),
                DepartmentId = employees
                    .Where(e => e.UserId == t.AssignedToId)
                    .Select(e => e.DepartmentId)
                    .FirstOrDefault()
            }).ToList();

            return new PagedResponseDto<TaskDto>
            {
                Draw = request.Draw,
                CurrentPage = request.Page,
                PageSize = request.PageSize,
                TotalCount = totalCount,
                TotalPages = (int)Math.Ceiling(totalCount / (double)request.PageSize),
                Items = taskDtos
            };
        }

    }
}
