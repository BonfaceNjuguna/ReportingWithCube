using ReportingWithCube.Analytics.Semantic;

namespace ReportingWithCube.Analytics.Translation;

/// <summary>
/// Registry of dataset definitions (semantic models)
/// This is where you define the business-to-technical mapping
/// </summary>
public interface IDatasetRegistry
{
    DatasetDefinition? GetDataset(string datasetId);
    IEnumerable<DatasetDefinition> GetAllDatasets();
}

public partial class DatasetRegistry : IDatasetRegistry
{
    private readonly Dictionary<string, DatasetDefinition> _datasets;

    public DatasetRegistry()
    {
        _datasets = new Dictionary<string, DatasetDefinition>
        {
            // Comprehensive datasets matching requirements
            // All datasets use EventsView cube which supports multiple event types (RFQ, RFI)
            ["events"] = CreateComprehensiveEventsDataset(),
        };
    }

    public DatasetDefinition? GetDataset(string datasetId)
    {
        return _datasets.TryGetValue(datasetId, out var dataset) ? dataset : null;
    }

    public IEnumerable<DatasetDefinition> GetAllDatasets()
    {
        return _datasets.Values;
    }
}
