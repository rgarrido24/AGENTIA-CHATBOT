import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/location_point.dart';

class ApiService {
  // Cambia esto por tu dominio real
  static const String baseUrl = "https://agentia.software/api/tracking";

  Future<String?> startJornada(String userId, String userName, String plaza) async {
    final res = await http.post(
      Uri.parse("$baseUrl/jornada/start"),
      headers: {"Content-Type": "application/json"},
      body: jsonEncode({"userId": userId, "userName": userName, "plaza": plaza}),
    );
    if (res.statusCode == 200) {
      final data = jsonDecode(res.body);
      return data["jornadaId"];
    }
    return null;
  }

  Future<bool> endJornada(String jornadaId) async {
    final res = await http.post(
      Uri.parse("$baseUrl/jornada/end"),
      headers: {"Content-Type": "application/json"},
      body: jsonEncode({"jornadaId": jornadaId}),
    );
    return res.statusCode == 200;
  }

  Future<bool> sendLocation(LocationPoint point) async {
    try {
      final res = await http.post(
        Uri.parse("$baseUrl/location"),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode(point.toJson()),
      );
      return res.statusCode == 200;
    } catch (e) {
      // Sin internet en ese momento — el punto se pierde en este MVP.
      // Fase 2: guardar en cola local (sqflite) y reintentar.
      return false;
    }
  }
}
