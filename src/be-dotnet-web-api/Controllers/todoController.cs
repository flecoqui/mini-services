using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Identity.Web.Resource;
using be_dotnet_web_api.Services;
using be_dotnet_web_api.Models;

namespace be_dotnet_web_api.Controllers;


[Authorize]
[ApiController]
[Route("[controller]")]
//[RequiredScope(RequiredScopesConfigurationKey = "AzureAd:Scopes")]
public class todoController : ControllerBase
{
    private readonly ILogger<todoController> _logger;

    private readonly ITableStorageToDoService _storageService;
    public todoController(ILogger<todoController> logger, ITableStorageToDoService storageService)
    {
        _logger = logger;
        _storageService = storageService ?? throw new ArgumentNullException(nameof(storageService));
    }
    private ObjectResult GenerateInternalError(Exception ex)
    {
        _logger.LogError($"Exception in GetAsync todoController: {ex}");
        Error error =  new Error();
        error.code = (int)ErrorCode.Exception;
        error.message = "Internal server error: Exception";
        error.creationDate = DateTime.UtcNow;
        error.source = "todoController";
        return StatusCode(500, error);
    } 

    [HttpGet()]
    public async Task<IActionResult> GetAsync()
    {
        try
        {
            List<ToDo>? list = await _storageService.RetrieveAllToDoAsync();
            if (list != null)
            {
                return Ok(list);
            }
            else
                return NotFound();
        }
        catch (Exception ex)
        {
            return GenerateInternalError(ex);
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetAsync(string id)
    {
        try
        {
            ToDo? ent = await _storageService.RetrieveToDoAsync(id);
            if (ent != null)
            {
            
                return Ok(ent);
            }
            else
                return NotFound();
        }
        catch (Exception ex)
        {
            return GenerateInternalError(ex);
        }
    }
    [HttpPost()]
    public async Task<IActionResult> PostAsync([FromBody] ToDoCreateRequest inputEntity)
    {
        try
        {
            ToDo entity = new ToDo();

            string Id = Guid.NewGuid().ToString();
            if(inputEntity.id != null)
                Id = inputEntity.id;
            entity.name = inputEntity.name;
            entity.id = Id;
            entity.uri = inputEntity.uri;
            entity.creationDate = DateTime.UtcNow;
            entity.error = new Error();
            entity.status = new StatusDetails();
            var createdEntity = await _storageService.InsertToDoAsync(entity);
            return CreatedAtAction(nameof(GetAsync), createdEntity);
        }
        catch (Exception ex)
        {
            return GenerateInternalError(ex);
        }
    }
    
    [HttpPut("{id}")]
    public async Task<IActionResult> PutAsync([FromBody] ToDoRequest entityRequest, string id)
    {
        try
        {
            if(!string.IsNullOrEmpty(id))
            {
                ToDo? ent = await _storageService.RetrieveToDoAsync(id);
                if (ent == null)
                    return NotFound();
                ToDo entity = new ToDo();
                entity.name = entityRequest.name;
                entity.id = id;
                entity.uri = entityRequest.uri;
                entity.creationDate = ent.creationDate;
                entity.error = new Error();
                entity.status = new StatusDetails();

                ToDo? entResult = await _storageService.UpdateToDoAsync(entity);
                if(entResult != null)
                    return Ok(entResult);
                else
                    return NotFound();
            }
            else
                return NotFound();
        }
        catch (Exception ex)
        {
            return GenerateInternalError(ex);
        }
    }
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAsync(string id)
    {
        try
        {
            var ent = await _storageService.RetrieveToDoAsync(id);
            if (ent == null)
                return NotFound();
            ToDo? entity = await _storageService.DeleteToDoAsync(id);
            if (entity != null)
                return Ok(ent);
            else 
                return NotFound();
        }
        catch (Exception ex)
        {
            return GenerateInternalError(ex);
        }
    }
}
