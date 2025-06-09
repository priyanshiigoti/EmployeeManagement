using System.ComponentModel.DataAnnotations;

namespace Employee_management.Shared.Dto
{
    public class EmployeeDto
    {
        public int Id { get; set; }

        public string UserId { get; set; }

        [Required(ErrorMessage = "First name is required")]
        public string FirstName { get; set; }

        [Required(ErrorMessage = "Last name is required")]
        public string LastName { get; set; }

        public string FullName => FirstName + " " + LastName;

        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email address")]
        public string Email { get; set; }

        public string PhoneNumber { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "Department must be selected")]
        public int? DepartmentId { get; set; }

        public string? DepartmentName { get; set; }

        public bool IsActive { get; set; }
    }

    public class PaginatedResult<T>
    {
        public IEnumerable<T> Items { get; set; } = Enumerable.Empty<T>();
        public int TotalCount { get; set; }
    }

}
