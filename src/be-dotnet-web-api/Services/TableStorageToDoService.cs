using be_dotnet_web_api.Models;
using Azure.Identity;
using Azure;
using Azure.Data.Tables;
using Azure.Data.Tables.Models;


namespace be_dotnet_web_api.Services
{
    public class TableStorageToDoService : ITableStorageToDoService
    {
        private const string TableName = "tododb";
        private const string PartitionKey = "todo";
        
        private readonly IConfiguration _configuration;

        private TableClient? _tableClient;

        public TableStorageToDoService(IConfiguration configuration)
        {
            _configuration = configuration;
            var client = GetInternalTableClient();
            if(client != null)
                _tableClient = client;
        }
                
        public async Task<List<ToDo>?> RetrieveAllToDoAsync()
        {

            var client = GetTableClient();
            if(client!= null){
                TableClient tableClient = client;
                AsyncPageable<ToDoEntity> queryResultsFilter = tableClient.QueryAsync<ToDoEntity>(filter: $"PartitionKey eq '{PartitionKey}'");

                List<ToDo> list = new List<ToDo>(); 
                // Iterate the <see cref="Pageable"> to access all queried entities.
                await foreach (ToDoEntity ent in queryResultsFilter)
                {
                    ToDo entity = new ToDo();
                    entity.id = ent.RowKey;
                    entity.uri = ent.uri;
                    entity.name = ent.name;
                    entity.creationDate = ent.creationDate; 
                    entity.error = new Error(ent.errorCode, ent.errorMessage, ent.errorSource, ent.errorCreationDate);
                    entity.status = new StatusDetails(ent.statusStatus, ent.statusStartDate, ent.statusStartDate);                

                    list.Add(entity);

                }            
                return list;
            }
            return null;            
        }

        public async Task<ToDo?> RetrieveToDoAsync(string id)
        {
            var client = GetTableClient();
            if(client != null )
            {
                TableClient tableClient = client;
                AsyncPageable<ToDoEntity> queryResultsFilter = tableClient.QueryAsync<ToDoEntity>(filter: $"PartitionKey eq '{PartitionKey}' and RowKey eq '{id}'");

                List<ToDo> list = new List<ToDo>(); 
                // Iterate the <see cref="Pageable"> to access all queried entities.
                await foreach (ToDoEntity ent in queryResultsFilter)
                {
                    ToDo entity = new ToDo();
                    entity.id = ent.RowKey;
                    entity.uri = ent.uri;
                    entity.name = ent.name;
                    entity.creationDate = ent.creationDate; 
                    entity.error = new Error(ent.errorCode, ent.errorMessage, ent.errorSource, ent.errorCreationDate);
                    entity.status = new StatusDetails(ent.statusStatus, ent.statusStartDate, ent.statusStartDate);                
                    return entity;
                }
            }
            return null;   
        }

        public async Task<ToDo?> InsertToDoAsync(ToDo entity)
        {
            var client = GetTableClient();
            if(client != null )
            {
                TableClient tableClient = client;
                try
                {
                    ToDoEntity entdb = new ToDoEntity();
                    entdb.uri = entity.uri;
                    entdb.name = entity.name;

                    entdb.errorCode = (entity.error!=null?entity.error.code:0);
                    entdb.errorMessage = (entity.error!=null?entity.error.message:"");
                    entdb.errorSource = (entity.error!=null?entity.error.source:"");
                    entdb.errorCreationDate = DateTime.SpecifyKind((entity.error!=null?entity.error.creationDate:DateTime.UtcNow), DateTimeKind.Utc);

                    entdb.statusStatus = (entity.status!=null?entity.status.status:Status.initialized);
                    entdb.statusStartDate = DateTime.SpecifyKind((entity.status!=null?entity.status.startDate:DateTime.UtcNow), DateTimeKind.Utc);
                    entdb.statusEndDate = DateTime.SpecifyKind((entity.status!=null?entity.status.endDate:DateTime.UtcNow), DateTimeKind.Utc);

                    entdb.creationDate = entity.creationDate;
                    entdb.PartitionKey = PartitionKey;
                    entdb.RowKey = entity.id;
                    Response response = tableClient.AddEntity(entdb);
                    //Console.WriteLine($"POST {response}");
                    if(response != null && response.Status == 204 )
                    {
                        if(!string.IsNullOrEmpty(entity.id))
                        {
                            var entityResult = await RetrieveToDoAsync(entity.id);
                            if (entityResult != null)
                            {        
                                return entityResult;
                            }
                        }
                    }
                }
                catch(RequestFailedException e)
                {
                    Console.WriteLine($"Exception: {e}");
                    return null;
                }
            }
            return null;
        }

        public async Task<ToDo?> UpdateToDoAsync(ToDo entity)
        {
            var client = GetTableClient();
            if(client != null )
            {
                TableClient tableClient = client;
                try
                {
                    ToDoEntity entdb = new ToDoEntity();
                    entdb.uri = entity.uri;
                    entdb.name = entity.name;

                    entdb.errorCode = (entity.error!=null?entity.error.code:0);
                    entdb.errorMessage = (entity.error!=null?entity.error.message:"");
                    entdb.errorSource = (entity.error!=null?entity.error.source:"");
                    entdb.errorCreationDate = DateTime.SpecifyKind((entity.error!=null?entity.error.creationDate:DateTime.UtcNow), DateTimeKind.Utc);

                    entdb.statusStatus = (entity.status!=null?entity.status.status:Status.initialized);
                    entdb.statusStartDate = DateTime.SpecifyKind((entity.status!=null?entity.status.startDate:DateTime.UtcNow), DateTimeKind.Utc);
                    entdb.statusEndDate = DateTime.SpecifyKind((entity.status!=null?entity.status.endDate:DateTime.UtcNow), DateTimeKind.Utc);

                    entdb.creationDate = entity.creationDate;
                    entdb.PartitionKey = PartitionKey;
                    entdb.RowKey = entity.id;
                    Response response = tableClient.UpdateEntity<ToDoEntity>(entdb,Azure.ETag.All);
                    //Console.WriteLine($"UPDATE {response}");
                    if(response != null && response.Status == 204 )
                    {
                        if(!string.IsNullOrEmpty(entity.id))
                        {
                            var entityResult = await RetrieveToDoAsync(entity.id);
                            if (entityResult != null)
                            {        
                                return entityResult;
                            }
                        }
                    }
                }
                catch(RequestFailedException e)
                {
                    Console.WriteLine($"Exception: {e}");
                    return null;
                }
            }
            return null;
        }

        public async Task<ToDo?> DeleteToDoAsync(string Id)
        {
            var client = GetTableClient();
            if(client != null )
            {
                TableClient tableClient = client;
                var entity = await RetrieveToDoAsync(Id);
                if (entity != null)
                {        
                    Response response = await tableClient.DeleteEntityAsync(PartitionKey, Id);
                    //Console.WriteLine($"DELETE {response}");
                    if(response != null && response.Status == 204 )
                    {                   
                        return entity;
                    }
                }
            }
            return null;            
        } 

        private TableClient? GetTableClient()
        {
            if(_tableClient == null)
            {
                var client = GetInternalTableClient();
                if(client != null)
                    _tableClient = client;
            }

            return _tableClient;
        }
        private TableClient? GetInternalTableClient()
        {
            // Construct the table endpoint from the arguments.
            string accountName = _configuration["StorageAccount"];
            string tableName = _configuration["ToDoTable"];
            if(string.IsNullOrEmpty(tableName))
                tableName = TableName;
            string tableEndpoint = string.Format("https://{0}.table.core.windows.net/",accountName);

            var credentials = new DefaultAzureCredential
            (
                new DefaultAzureCredentialOptions
                {
                    // Linux platform
                    ExcludeSharedTokenCacheCredential = true,
                }
            );
            // Get a token credential and create a service client object for the table.
            TableClient tableClient = new TableClient(new Uri(tableEndpoint), 
                                                        tableName, 
                                                        credentials);
            try
            {
                // Create the table.
                Response<TableItem> response = tableClient.CreateIfNotExists();
            }
            catch (RequestFailedException e)
            {
                Console.WriteLine("Exception: {0}", e.Message);
                return null;
            }

            return tableClient;
        }        
    }
}