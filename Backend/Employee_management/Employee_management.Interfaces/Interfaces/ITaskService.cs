
using Employee_management.Shared.Dto;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Employee_management.Interfaces.Interfaces
{
    public interface ITaskService
    {
        Task<IEnumerable<TaskDto>> GetAllAsync(string userId, string role);
        Task<TaskDto> GetByIdAsync(int id, string userId, string role);
        Task<(bool Success, string Error)> CreateAsync(TaskDto dto, string userId, string role);
        Task<(bool Success, string Error)> UpdateAsync(TaskDto dto, string userId, string role);
        Task<bool> DeleteAsync(int id, string userId, string role);
        Task<IEnumerable<EmployeeDropdownDto>> GetEmployeesAsync(string userId, string role);
    }
}

