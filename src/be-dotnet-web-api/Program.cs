using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Identity.Web;
using be_dotnet_web_api.Services;
using Microsoft.AspNetCore.Authorization;

var builder = WebApplication.CreateBuilder(args);

// Add a custom scoped service.
builder.Services.AddScoped<ITableStorageToDoService, TableStorageToDoService>();

// Add services to the container.
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddMicrosoftIdentityWebApi(builder.Configuration.GetSection("AzureAd"));

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

//app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();            
app.UseDefaultFiles();
app.UseAuthentication();
app.UseAuthorization();

if (app.Environment.IsDevelopment())
    app.MapControllers().WithMetadata(new AllowAnonymousAttribute());
else
    app.MapControllers();

app.MapDefaultControllerRoute();
app.Run();
