
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

namespace be_dotnet_web_api.Tests.UnitTests;


public class timeControllerTests
{
    #region snippet_ApiMiniControllerTests1
    [Fact]
    public async  Task Create_ReturnsBadRequest_GivenInvalidModel()
    {
        // Arrange & Act
        var mockRepoLogger = new Mock<ILogger<timeController>>();
        var controller = new timeController(mockRepoLogger.Object);

        // Act
        var result = controller.GetTime();

        Console.WriteLine($"Test Time: {result}");
        await Task.Delay(0);
        Assert.IsType<string>(result);
    }
    #endregion
}
