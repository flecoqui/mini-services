namespace be_dotnet_web_api.Models
{
    public enum Status {
        initialized,
        inProgress,
        failed,
        succeeded
    }
    public class StatusDetails

    {
        public StatusDetails()
        {
            this.status = Status.initialized;
            this.startDate = DateTime.UtcNow;
            this.endDate = DateTime.MaxValue;
        }
        public StatusDetails(Status status, DateTime startDate, DateTime endDate)
        {
            this.status = status;
            this.startDate = startDate;
            this.endDate = endDate;
        }
        public Status  status { get; set; }
        public DateTime startDate { get; set; }
        public DateTime endDate { get; set; }
    }
}