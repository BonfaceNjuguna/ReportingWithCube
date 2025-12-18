using ReportingWithCube.Analytics.Core;
using ReportingWithCube.Analytics.Semantic;
using ReportingWithCube.Analytics.Semantic.Builders;

namespace ReportingWithCube.Analytics.Translation;

public interface IDatasetRegistry
{
    DatasetDefinition? GetDataset(string datasetId);
    IEnumerable<DatasetDefinition> GetAllDatasets();
}

public partial class DatasetRegistry : IDatasetRegistry
{
    private readonly Dictionary<string, DatasetDefinition> _datasets;
    private readonly IDatasetBuilder _eventDatasetBuilder;
    private readonly IDatasetBuilder _supplierDatasetBuilder;
    private readonly IDatasetBuilder _itemDatasetBuilder;

    public DatasetRegistry()
    {
        _eventDatasetBuilder = new EventDatasetBuilder();
        _supplierDatasetBuilder = new SupplierDatasetBuilder();
        _itemDatasetBuilder = new ItemDatasetBuilder();
        
        _datasets = new Dictionary<string, DatasetDefinition>
        {
            // Event datasets built using builder pattern
            ["events"] = _eventDatasetBuilder.Build(EventType.All),
            ["events-rfq"] = _eventDatasetBuilder.Build(EventType.RFQ),
            ["events-rfi"] = _eventDatasetBuilder.Build(EventType.RFI),
            
            // Supplier and item datasets
            ["supplier_reports"] = _supplierDatasetBuilder.Build(EventType.All),
            ["item_reports"] = _itemDatasetBuilder.Build(EventType.All)
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
