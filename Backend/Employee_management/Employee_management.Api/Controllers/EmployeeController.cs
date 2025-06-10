using Employee_management.Api.Data;
using Employee_management.Interfaces.Interfaces;
using Employee_management.Shared.Dto;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Employee_management.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class EmployeeController : ControllerBase
    {
        private readonly IEmployeeService _employeeService;
        private readonly ApplicationDbContext _context;
        private readonly ILogger<EmployeeController> _logger;
        private readonly IWebHostEnvironment _env;

        public EmployeeController(
            IEmployeeService employeeService,
            ApplicationDbContext context,
            ILogger<EmployeeController> logger,
            IWebHostEnvironment env)
        {
            _employeeService = employeeService;
            _context = context;
            _logger = logger;
            _env = env;
        }

        // GET: api/Employee
        [HttpGet]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> GetAll([FromQuery] PaginationRequestDto request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var user = HttpContext.User;
                var isAdmin = user.IsInRole("Admin");
                var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                var result = await _employeeService.GetEmployeesPaginatedAsync(request, userId, isAdmin);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching paginated employee list");
                return StatusCode(500, "Internal server error");
            }
        }


        [HttpGet("role/{roleName}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<IEnumerable<object>>> GetByRole(string roleName)
        {
            try
            {
                var employees = await _employeeService.GetEmployeesByRoleAsync(roleName);

                var result = employees.Select(e => new
                {
                    id = e.Id,
                    userId = e.UserId,
                    fullName = $"{e.FirstName} {e.LastName}".Trim(),
                    email = e.Email,
                    phoneNumber = e.PhoneNumber,
                    departmentName = e.DepartmentName,
                    departmentId = e.DepartmentId,
                    isActive = e.IsActive
                });

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching employees by role");
                return StatusCode(500, "An error occurred while fetching employees by role");
            }
        }

        [HttpGet("managerpaged")]
        public async Task<IActionResult> GetManagersPaged([FromQuery] PaginationRequestDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var pagedManagers = await _employeeService.GetManagersPaginatedAsync(request);
            return Ok(pagedManagers);
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> CreateEmployee([FromBody] EmployeeDto dto)
        {
            var result = await _employeeService.CreateAsync(dto);
            if (result)
                return Ok(new { Message = "Employee created successfully." });

            return BadRequest("Could not create employee.");
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> UpdateEmployee(int id, [FromBody] EmployeeDto dto)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors)
                                               .Select(e => e.ErrorMessage)
                                               .ToList();
                return BadRequest(new
                {
                    type = "Validation Error",
                    title = "Model validation failed",
                    status = 400,
                    errors = errors
                });
            }

            if (id != dto.Id)
            {
                return BadRequest(new
                {
                    type = "ID Mismatch",
                    title = "Validation Error",
                    status = 400,
                    message = "Route ID does not match employee ID"
                });
            }

            var result = await _employeeService.UpdateAsync(dto);
            if (result)
                return Ok(new { Message = "Employee updated successfully." });

            return NotFound(new
            {
                type = "Not Found",
                title = "Employee Not Found",
                status = 404,
                message = $"Employee with ID {id} not found"
            });
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteEmployee(int id)
        {
            try
            {
                var result = await _employeeService.DeleteAsync(id);
                if (result)
                    return Ok(new { Message = "Employee deleted successfully." });

                return NotFound("Employee not found");
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("manager")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateManager([FromForm] CreateManagerDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                // Validate department exists if assigned
                if (dto.DepartmentId != null)
                {
                    var departmentExists = await _context.Departments.AnyAsync(d => d.Id == dto.DepartmentId);
                    if (!departmentExists)
                        return BadRequest(new { Message = "Invalid department specified." });
                }

                string? profileImagePath = null;
                if (dto.ProfileImage != null && dto.ProfileImage.Length > 0)
                {
                    // Save the image to wwwroot/images/managers or any folder
                    var uploadsFolder = Path.Combine(_env.WebRootPath, "images", "managers");
                    if (!Directory.Exists(uploadsFolder))
                        Directory.CreateDirectory(uploadsFolder);

                    var uniqueFileName = Guid.NewGuid().ToString() + Path.GetExtension(dto.ProfileImage.FileName);
                    var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                    using (var fileStream = new FileStream(filePath, FileMode.Create))
                    {
                        await dto.ProfileImage.CopyToAsync(fileStream);
                    }

                    profileImagePath = Path.Combine("images", "managers", uniqueFileName).Replace("\\", "/");
                }

                // Set the ProfileImagePath in dto for the service method
                dto.ProfileImagePath = profileImagePath;

                var (success, errorMessage) = await _employeeService.CreateManagerAsync(dto);
                if (!success)
                    return BadRequest(new { Message = errorMessage });

                return Ok(new { Message = "Manager created successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating manager");
                return StatusCode(500, new { Message = "Internal Server Error", Error = ex.Message });
            }
        }


        [HttpPut("manager/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateManager(int id, [FromForm] UpdateManagerDto dto)
        {
            try
            {
                if (dto.DepartmentId != null)
                {
                    var departmentExists = await _context.Departments.AnyAsync(d => d.Id == dto.DepartmentId);
                    if (!departmentExists)
                        return BadRequest(new { Message = "Invalid department specified." });
                }

                // If ProfileImage is present, save it first and set ProfileImagePath
                if (dto.ProfileImage != null)
                {
                    var imagePath = await _employeeService.SaveProfileImageAsync(dto.ProfileImage);
                    dto.ProfileImagePath = imagePath;
                }

                var result = await _employeeService.UpdateManagerAsync(id, dto);
                if (!result)
                    return NotFound();

                return Ok(new { Message = "Manager updated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating manager");
                return StatusCode(500, new { Message = "Internal Server Error", Error = ex.Message });
            }
        }


        [HttpGet("manager/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<CreateManagerDto>> GetManager(int id)
        {
            var manager = await _employeeService.GetManagerByIdAsync(id);
            if (manager == null)
                return NotFound();

            return Ok(manager);
        }


        [HttpDelete("manager/{employeeId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteManager(int employeeId)
        {
            // Find the Employee record by employeeId, including the related User entity
            var managerEmployee = await _context.Employees
                .Include(e => e.User)
                .FirstOrDefaultAsync(e => e.Id == employeeId);

            if (managerEmployee == null)
                return NotFound(new { Message = "Manager not found" });

            // Check if this manager is assigned as a manager to any employees
            var managesEmployees = await _context.Employees.AnyAsync(e => e.ManagerId == managerEmployee.UserId);
            if (managesEmployees)
                return BadRequest(new { Message = "Cannot delete manager: they are assigned as manager to other employees." });

            // Check if this manager is assigned to any tasks
            var hasAssignedTasks = await _context.Tasks.AnyAsync(t => t.AssignedToId == managerEmployee.UserId);
            if (hasAssignedTasks)
                return BadRequest(new { Message = "Cannot delete manager: they are assigned to tasks." });

            // Remove the User entity if it exists
            if (managerEmployee.User != null)
                _context.Users.Remove(managerEmployee.User);

            // Remove the Employee entity
            _context.Employees.Remove(managerEmployee);

            // Save changes to the database
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Manager deleted successfully" });
        }


        [HttpGet("{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<EmployeeDto>> GetEmployee(int id)
        {
            var employee = await _employeeService.GetByIdAsync(id);
            if (employee == null)
                return NotFound();

            return Ok(employee);
        }

        [HttpGet("active")]
        [AllowAnonymous] 
        public async Task<IActionResult> GetActiveDepartments()
        {
            var departments = await _context.Departments
                .Where(d => d.IsActive) // Only if you have IsActive column
                .Select(d => new
                {
                    id = d.Id,
                    name = d.Name
                })
                .ToListAsync();

            return Ok(departments);
        }

    }
}
