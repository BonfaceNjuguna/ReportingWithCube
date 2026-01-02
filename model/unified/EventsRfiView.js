// View exposing RequestForInformation cube for RFI events with all KPIs
view('EventsRfiView', {
  description: `Unified view for Request for Information (RFI) events`,
  cubes: [
    {
      join_path: RequestForInformation,
      includes: '*'
    }
  ]
});
