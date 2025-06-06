using Employee_management.Api.Data;
using Employee_management.Interfaces.Interfaces;
using Employee_management.Shared.Dto;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Employee_management.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class TaskController : ControllerBase
    {
        private readonly ITaskService _taskService;
        private readonly ApplicationDbContext _context;


        public TaskController(ITaskService taskService, ApplicationDbContext context)
        {
            _taskService = taskService;
            _context = context;
        }

        private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier);
        private string GetUserRole() => User.FindFirstValue(ClaimTypes.Role);

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var tasks = await _taskService.GetAllAsync(GetUserId(), GetUserRole());
            return Ok(tasks);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var task = await _taskService.GetByIdAsync(id, GetUserId(), GetUserRole());
            return task != null ? Ok(task) : NotFound();
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] TaskDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _taskService.CreateAsync(dto, GetUserId(), GetUserRole());
            return result.Success ? Ok() : BadRequest(result.Error);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] TaskDto dto)
        {
            dto.Id = id;
            var result = await _taskService.UpdateAsync(dto, GetUserId(), GetUserRole());
            return result.Success ? Ok() : BadRequest(result.Error);
        }

        // Update the Delete method to return proper error messages
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _taskService.DeleteAsync(id, GetUserId(), GetUserRole());

            if (result)
            {
                return Ok();
            }

            // Return more specific error messages
            var task = await _context.Tasks.FindAsync(id);
            if (task == null)
            {
                return NotFound("Task not found");
            }

            return BadRequest("You are not authorized to delete this task");
        }

        [HttpGet("employees")]
        public async Task<IActionResult> GetEmployees()
        {
            var employees = await _taskService.GetEmployeesAsync(GetUserId(), GetUserRole());
            return Ok(employees);
        }

    }
}