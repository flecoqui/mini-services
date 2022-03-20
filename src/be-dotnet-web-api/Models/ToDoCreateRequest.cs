namespace be_dotnet_web_api.Models
{
    public class ToDoCreateRequest
    {
        public string? id { get; set; }
        public string name { get; set; }= default!;
        public string? uri { get; set; }
    }
}