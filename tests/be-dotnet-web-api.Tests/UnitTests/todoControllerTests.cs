
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Identity.Web.Resource;
using be_dotnet_web_api.Services;
using be_dotnet_web_api.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Moq;
using be_dotnet_web_api.Controllers;
using Xunit;
using Microsoft.Extensions.Logging;
using be_dotnet_web_api.Tests.UnitTests.Attributes;


namespace be_dotnet_web_api.Tests.UnitTests
{

public class MockTableStorageToDoService : ITableStorageToDoService
{

    private Dictionary<string, ToDo> _table = new Dictionary<string, ToDo>();

    public async Task<List<ToDo>?> RetrieveAllToDoAsync()
    {
        await Task.Delay(0);
        return _table.Values.ToList();            
    }

    public async Task<ToDo?> RetrieveToDoAsync(string id)
    {
        await Task.Delay(0);
        // Iterate the <see cref="Pageable"> to access all queried entities.
        if(_table.Keys.Contains(id))
            return _table[id]; 
        return null;   
    }

    public async Task<ToDo?> InsertToDoAsync(ToDo entity)
    {
        await Task.Delay(0);
        if (entity.id != null)
        {
            _table.Add(entity.id, entity);
            return entity;
        }
        return null;
    }

    public async Task<ToDo?> UpdateToDoAsync(ToDo entity)
    {
        await Task.Delay(0);
        if(_table.Keys.Contains(entity.id))
            if (entity.id != null)
            {
                _table[entity.id] = entity;
                return entity;
            }
         return null;
    }

    public async Task<ToDo?> DeleteToDoAsync(string id)
    {
        await Task.Delay(0);
        if(_table.Keys.Contains(id))
        {
            ToDo dub = _table[id]; 
            _table.Remove(id);
            return dub;
        } 
        return null;
    } 

        
}

[TestCaseOrderer("be_dotnet_web_api.Tests.UnitTests.Orderers.PriorityOrderer", "be-dotnet-web-api.Tests")]
public class todoControllerTests
{
    private static string? _id; 
    private static todoController? _controller;
    public todoControllerTests()
    {
        if(todoControllerTests._controller == null){
            todoControllerTests._id = "00000000-0000-0000-0000-000000000001";
            var mockRepoLogger = new Mock<ILogger<todoController>>();
            var mockRepo = new Mock<MockTableStorageToDoService>();
            todoControllerTests._controller = new todoController(mockRepoLogger.Object,mockRepo.Object);
        }
    }

    #region Test_PostAsync
    [Fact, TestPriority(0)]
    public async Task Test_PostAsync()
    {
        if (_controller != null)
        {

            ToDoCreateRequest todo = new ToDoCreateRequest();
            todo.uri = "https://mock.com/00000000-0000-0000-0000-000000000001";
            // Act
            var result = await _controller.PostAsync(todo);

            // Assert
            //Console.WriteLine($"Test_PostAsync ToDo: {result}");
            _id = "00000000-0000-0000-0000-000000000002";
            Assert.IsType<CreatedAtActionResult>(result);
            if (result is CreatedAtActionResult)
            {
                CreatedAtActionResult? cr = result as CreatedAtActionResult;
                if (cr != null)
                {
                    //Console.WriteLine($"Test_PostAsync ToDo value: {cr.Value}");
                    Assert.IsType<ToDo>(cr.Value);
                    // Save id of the new ToDo
                    if (cr.Value is ToDo)
                    {
                        ToDo? dc = cr.Value as ToDo;
                        if (dc != null)
                        {
                            todoControllerTests._id = dc.id;
                            Console.WriteLine($"Test_PostAsync new ToDo id: {todoControllerTests._id}");
                        }
                    }
                }
            }
        }
    }
    
    #endregion

    #region Test_GetAsync
    [Fact, TestPriority(1)]
    public async Task Test_GetAsync()
    {
            if (_controller != null)
            {
                // Act
                var result = await _controller.GetAsync();

                // Assert
                //Console.WriteLine($"Test Test_GetAsync: {result}");
                Assert.IsType<OkObjectResult>(result);
                if (result is OkObjectResult)
                {
                    OkObjectResult? cr = result as OkObjectResult;
                    if (cr != null)
                    {
                        //Console.WriteLine($"Test_GetAsync List<ToDo> value: {cr.Value}");
                        Assert.IsType<List<ToDo>>(cr.Value);
                    }
                }
            }

    }
    #endregion



    #region Test_GetAsync_1        
    [Fact, TestPriority(2)]
    public async Task Test_GetAsync_1()
    {
        if (_controller != null)
        {
            if (_id != null)
            {
                // Act
                Console.WriteLine($"Test_GetAsync_1 ToDo id: {_id}");
                var result = await _controller.GetAsync(_id);

                // Assert
                //Console.WriteLine($"Test_GetAsync_1 ToDo: {result}");
                Assert.IsType<OkObjectResult>(result);
                if (result is OkObjectResult)
                {
                    OkObjectResult? cr = result as OkObjectResult;
                    if (cr != null)
                    {
                        //Console.WriteLine($"Test_GetAsync_1 ToDo value: {cr.Value}");
                        Assert.IsType<ToDo>(cr.Value);
                    }
                }
            }
        }
        
    }
    #endregion

    #region Test_PutAsync        
    [Fact, TestPriority(3)]
    public async Task Test_PutAsync()
    {

        if (_controller != null)
        {
            if (_id != null)
            {
                ToDoRequest todo = new ToDoRequest();
                todo.uri = "https://mock.com/00000000-0000-0000-0000-000000000002";
                // Act
                Console.WriteLine($"Test_PutAsync ToDo id: {_id}");
                var result = await _controller.PutAsync(todo, _id);

                // Assert
                //Console.WriteLine($"Test_PutAsync ToDo: {result}");
                Assert.IsType<OkObjectResult>(result);
                if (result is OkObjectResult)
                {
                    OkObjectResult? cr = result as OkObjectResult;
                    if (cr != null)
                    {
                        //Console.WriteLine($"Test_PutAsync_ ToDo value: {cr.Value}");
                        Assert.IsType<ToDo>(cr.Value);
                    }
                }
            }
        }
    }
    #endregion

    #region Test_DeleteAsync        
    [Fact, TestPriority(4)]
    public async Task Test_DeleteAsync()
    {
        if (_controller != null)
        {
            if (_id != null)
            {

                // Act
                Console.WriteLine($"Test_DeleteAsync ToDo id: {_id}");
                var result = await _controller.DeleteAsync(_id);

                // Assert
                //Console.WriteLine($"Test_DeleteAsync ToDo: {result}");
                Assert.IsType<OkObjectResult>(result);
                if (result is OkObjectResult)
                {
                    OkObjectResult? cr = result as OkObjectResult;
                    if (cr != null)
                    {
                        //Console.WriteLine($"Test_DeleteAsync_1 ToDo value: {cr.Value}");
                        Assert.IsType<ToDo>(cr.Value);
                    }
                }
            }
        }
    }
    #endregion
}
}