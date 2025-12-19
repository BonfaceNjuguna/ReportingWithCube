using Microsoft.EntityFrameworkCore;
using ReportingWithCube.Data;
using ReportingWithCube.Services;
using ReportingWithCube.Analytics.Translation;
using ReportingWithCube.Analytics.Translation.Strategies;
using ReportingWithCube.Analytics.Validation;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();

// Configure CORS for frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Configure Database
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<ReportingDbContext>(options =>
    options.UseNpgsql(connectionString));

// Register HttpClient for Cube.js
builder.Services.AddHttpClient<ICubeService, CubeService>();

// Register application services
builder.Services.AddScoped<ICubeService, CubeService>();
builder.Services.AddScoped<ISavedReportService, SavedReportService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();

// Register translation layer services
builder.Services.AddSingleton<IDatasetRegistry, DatasetRegistry>();

// Register translation strategies
builder.Services.AddScoped<ITranslationStrategy, EventTranslationStrategy>();
builder.Services.AddScoped<ITranslationStrategy, SupplierTranslationStrategy>();
builder.Services.AddScoped<ITranslationStrategy, ItemTranslationStrategy>();

builder.Services.AddScoped<IAnalyticsQueryBuilder, AnalyticsQueryBuilder>();
builder.Services.AddScoped<IAnalyticsQueryValidator, AnalyticsQueryValidator>();

// Add logging
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseDeveloperExceptionPage();
}

app.UseHttpsRedirection();
app.UseCors("AllowFrontend");

app.UseAuthorization();

app.MapControllers();

// Health check endpoint
app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }))
   .WithName("HealthCheck");

app.Run();