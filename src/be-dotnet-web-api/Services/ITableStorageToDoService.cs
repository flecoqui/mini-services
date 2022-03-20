using be_dotnet_web_api.Models;
using System.Threading.Tasks;

namespace be_dotnet_web_api.Services
{
    public interface ITableStorageToDoService
    {
        Task<List<ToDo>?> RetrieveAllToDoAsync();
        Task<ToDo?> RetrieveToDoAsync(string id);
        Task<ToDo?> InsertToDoAsync(ToDo entity);
        Task<ToDo?> UpdateToDoAsync(ToDo entity);
        Task<ToDo?> DeleteToDoAsync(string id);
    }
}