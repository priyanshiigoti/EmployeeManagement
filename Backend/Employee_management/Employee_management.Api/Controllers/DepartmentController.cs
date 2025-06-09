using Employee_management.Shared.Dto;
using Employee_management.Interfaces.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace Employee_management.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class DepartmentController : ControllerBase
    {
        private readonly IDepartmentService _departmentService;

        public DepartmentController(IDepartmentService departmentService)
        {
            _departmentService = departmentService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] PaginationRequestDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var pagedDepartments = await _departmentService.GetDepartmentsPaginatedAsync(request);
            return Ok(pagedDepartments);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] DepartmentDto dto)
        {
            if (!ModelState.IsValid)
            {
                // Collect model validation errors into a dictionary
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();

                return BadRequest(new { message = "Validation failed", errors });
            }

            var result = await _departmentService.CreateDepartmentAsync(dto);

            if (!result)
                return BadRequest(new { message = "Department name already exists or is invalid." });

            return Ok(new { message = "Department created successfully" });
        }


        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] DepartmentDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            dto.Id = id;
            var result = await _departmentService.UpdateDepartmentAsync(dto);

            if (!result)
                return BadRequest("Department not found or name already exists.");

            return Ok();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _departmentService.DeleteDepartmentAsync(id);

            if (!result)
                return BadRequest("Department not found or it has employees assigned.");

            return Ok();
        }
    }
}
