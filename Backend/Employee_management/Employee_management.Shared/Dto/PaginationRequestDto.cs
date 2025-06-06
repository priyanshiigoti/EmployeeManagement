using System.ComponentModel.DataAnnotations;

namespace Employee_management.Shared.Dto
{
    public class PaginationRequestDto
    {
        public int Draw { get; set; } // Used by DataTables
        public int Start { get; set; } = 0; // Index of first record
        public int Length { get; set; } = 10; // Records per page

        public string? SearchTerm { get; set; }

        public string SortColumn { get; set; } = "Name";

        public string SortDirection { get; set; } = "asc";

        public int Page { get; set; } = 1;         // Add setter
        public int PageSize { get; set; } = 10;    // Add setter
    }


}
