class LocationPoint {
  final String userId;
  final String userName;
  final String jornadaId;
  final double lat;
  final double lng;
  final DateTime timestamp;
  final int? batteryLevel;

  LocationPoint({
    required this.userId,
    required this.userName,
    required this.jornadaId,
    required this.lat,
    required this.lng,
    required this.timestamp,
    this.batteryLevel,
  });

  Map<String, dynamic> toJson() => {
        "userId": userId,
        "userName": userName,
        "jornadaId": jornadaId,
        "lat": lat,
        "lng": lng,
        "timestamp": timestamp.toIso8601String(),
        "batteryLevel": batteryLevel,
      };
}
