// View exposing MaterialRfq cube for RFQ events with all KPIs
view('EventsRfqView', {
  description: `Unified view for Material Request for Quotation (RFQ) events`,
  cubes: [
    {
      join_path: MaterialRfq,
      includes: '*'
    }
  ]
});
