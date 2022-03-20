namespace be_dotnet_web_api.Models
{
    public class ToDoRequest
    {
        public string name { get; set; }= default!;
        public string? uri { get; set; }
    }
}