using Azure;
using Azure.Data.Tables;
namespace be_dotnet_web_api.Models
{
    public class ToDoEntity : ITableEntity
    {
        public string? PartitionKey { get; set; }
        public string? RowKey { get; set; }
        public DateTimeOffset? Timestamp { get; set; }
        public ETag ETag { get; set; }
        
        public string name { get; set; }= default!;
        public string? uri { get; set; }
        public DateTime creationDate { get; set; }
        public int errorCode { get; set; }
        public string? errorMessage { get; set; }
        public string? errorSource { get; set; }
        public DateTime errorCreationDate { get; set; }        
        public Status  statusStatus { get; set; }
        public DateTime statusStartDate { get; set; }
        public DateTime statusEndDate { get; set; }          
    }
}