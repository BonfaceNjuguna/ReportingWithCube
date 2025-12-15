using System.Text.Json;

namespace ReportingWithCube.Services;

/// <summary>
/// Service to interact with Cube.js API
/// </summary>
public interface ICubeService
{
    Task<T> ExecuteQueryAsync<T>(object query);
    Task<object> ExecuteQueryAsync(object query);
    Task<object> GetMetaAsync();
}

public class CubeService : ICubeService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<CubeService> _logger;

    public CubeService(
        HttpClient httpClient, 
        IConfiguration configuration,
        ILogger<CubeService> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;

        var cubeApiUrl = _configuration["Cube:ApiUrl"] ?? "http://localhost:4000";
        var cubeApiToken = _configuration["Cube:ApiToken"];

        _httpClient.BaseAddress = new Uri(cubeApiUrl);
        if (!string.IsNullOrEmpty(cubeApiToken))
        {
            _httpClient.DefaultRequestHeaders.Add("Authorization", cubeApiToken);
        }
    }

    public async Task<T> ExecuteQueryAsync<T>(object query)
    {
        var result = await ExecuteQueryAsync(query);
        return JsonSerializer.Deserialize<T>(JsonSerializer.Serialize(result))!;
    }

    public async Task<object> ExecuteQueryAsync(object query)
    {
        try
        {
            var serializerOptions = new JsonSerializerOptions 
            { 
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
            };
            var queryJson = JsonSerializer.Serialize(new { query }, serializerOptions);
            _logger.LogInformation("Sending query to Cube.js: {Query}", queryJson);
            
            var content = new StringContent(queryJson, System.Text.Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync("/cubejs-api/v1/load", content);
            
            var responseContent = await response.Content.ReadAsStringAsync();
            _logger.LogInformation("Cube.js response ({StatusCode}): {Response}", response.StatusCode, responseContent);
            
            response.EnsureSuccessStatusCode();

            var result = JsonSerializer.Deserialize<JsonElement>(responseContent);

            // Extract data from Cube.js response format
            if (result.TryGetProperty("data", out var data))
            {
                return data;
            }

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error executing Cube.js query");
            throw;
        }
    }

    public async Task<object> GetMetaAsync()
    {
        try
        {
            var response = await _httpClient.GetAsync("/cubejs-api/v1/meta");
            response.EnsureSuccessStatusCode();

            var responseContent = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<JsonElement>(responseContent);

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting Cube.js metadata");
            throw;
        }
    }
}
