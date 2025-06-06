using System;
using System.ComponentModel.DataAnnotations;

namespace Employee_management.Shared.Dto

{
    public class TaskDto
    {
        public int Id { get; set; }

        [Required(ErrorMessage = "Title is required")]
        public string Title { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;
        public DateTime? DueDate { get; set; }

        [Required(ErrorMessage = "Employee must be assigned")]
        public string AssignedUserId { get; set; }

        [Required(ErrorMessage = "Status is required")]
        public string Status { get; set; } = "Pending";

        public string AssignedEmployeeName { get; set; }
        public int? DepartmentId { get; set; }
    }
}