using Employee_management.Shared.Dto;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Employee_management.Interfaces.Interfaces
{
    public interface IDepartmentService
    {
        Task<IEnumerable<DepartmentDto>> GetAllDepartmentsAsync();
        Task<bool> CreateDepartmentAsync(DepartmentDto dto);
        Task<bool> UpdateDepartmentAsync(DepartmentDto dto);
        //Task<DeleteResult> DeleteDepartmentAsync(int id);
        Task<PagedResponseDto<DepartmentDto>> GetDepartmentsPaginatedAsync(PaginationRequestDto request);
        Task<bool> DeleteDepartmentAsync(int id);
    }
}
