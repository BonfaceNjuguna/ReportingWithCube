// View exposing MaterialRfq cube for RFQ events with all KPIs
view('EventsRfqView', {
  cubes: [
    {
      join_path: MaterialRfq,
      includes: '*'
    }
  ]
});
