using Employee_management.Api.Data;
using Employee_management.Api.Services.Classes;
using Employee_management.Shared.Dto;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;
using Employee_management.Shared.Dto;
using Employee_management.Interfaces.Interfaces;

namespace Employee_management.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class DepartmentController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IDepartmentService _departmentService;

        public DepartmentController(IDepartmentService departmentService,ApplicationDbContext context)
        {
            _departmentService = departmentService;
            _context = context;
        }
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] PaginationRequestDto request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var pagedDepartments = await _departmentService.GetDepartmentsPaginatedAsync(request);
            return Ok(pagedDepartments);
        }




        [HttpPost]
        public async Task<IActionResult> Create([FromBody] DepartmentDto dto)
        {
            var result = await _departmentService.CreateDepartmentAsync(dto);
            return result ? Ok() : BadRequest("Failed to create department");
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] DepartmentDto dto)
        {
            dto.Id = id;
            var result = await _departmentService.UpdateDepartmentAsync(dto);
            return result ? Ok() : BadRequest("Failed to update department");
        }

        //[HttpDelete("{id}")]
        //public async Task<IActionResult> Delete(int id)
        //{
        //    var result = await _departmentService.DeleteDepartmentAsync(id);

        //    return result switch
        //    {
        //        DepartmentService.DeleteResult.Success => Ok(),
        //        DepartmentService.DeleteResult.NotFound => NotFound("Department not found"),
        //        DepartmentService.DeleteResult.HasEmployees => BadRequest("Cannot delete department because it has employees."),
        //        _ => StatusCode(500, "Unknown error occurred during deletion")
        //    };
        //}

       

    }
}