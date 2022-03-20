namespace be_dotnet_web_api.Models
{
    public class ToDo
    {
        public string name { get; set; }= default!;
        public string? id { get; set; }
        public string? uri { get; set; }
        public DateTime creationDate { get; set; }

        public Error? error {get; set;}
        public StatusDetails? status {get; set;}
        

    }
}