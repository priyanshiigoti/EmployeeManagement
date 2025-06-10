using Employee_management.Shared.Dto;
using Employee_management.Shared;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;

namespace Employee_management.Interfaces.Interfaces
{
    public interface IEmployeeService
    {
        Task<PagedResponseDto<EmployeeDto>> GetEmployeesPaginatedAsync(PaginationRequestDto request, string? currentUserId, bool isAdmin);

        Task<IEnumerable<EmployeeDto>> GetAssignableEmployeesAsync();

        Task<IEnumerable<EmployeeDto>> GetEmployeesByRoleAsync(string roleName);

        Task<EmployeeDto> GetByIdAsync(int id);

        Task<bool> CreateAsync(EmployeeDto dto);

        Task<(bool Success, string ErrorMessage)> CreateManagerAsync(CreateManagerDto dto);

        Task<IEnumerable<DepartmentDto>> GetActiveDepartmentsAsync();

        Task<bool> UpdateAsync(EmployeeDto dto);

        Task<bool> DeleteAsync(int id);

        Task<CreateManagerDto> GetManagerByIdAsync(int id);

        Task<bool> UpdateManagerAsync(int employeeId, UpdateManagerDto dto);

        Task<bool> DeleteManagerByUserIdAsync(string userId);

        Task<IEnumerable<EmployeeDto>> GetEmployeesByDepartmentAsync(int departmentId);

        Task<int?> GetDepartmentIdByUserIdAsync(string userId);

        Task<ApplicationUser> GetUserByIdAsync(string userId);

        Task<PagedResponseDto<CreateManagerDto>> GetManagersPaginatedAsync(PaginationRequestDto request);

        Task<string?> SaveProfileImageAsync(IFormFile? file);

    }
}
