namespace Employee_management.Shared.Dto
{
    public class PagedResponseDto<T>
    {
        public int Draw { get; set; }  // Add this
        public int CurrentPage { get; set; }
        public int TotalPages { get; set; }
        public int PageSize { get; set; }
        public int TotalCount { get; set; }
        public List<T> Items { get; set; }
    }

}
