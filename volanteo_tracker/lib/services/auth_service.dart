import 'package:shared_preferences/shared_preferences.dart';

class AuthService {
  // Empleados hardcodeados para el MVP. Después esto puede venir de Mongo.
  static final Map<String, Map<String, String>> _empleados = {
    "emp001": {"password": "1234", "nombre": "Rodolfo Garrido"},
    "emp002": {"password": "1234", "nombre": "Jesus Espejo"},
    "emp003": {"password": "1234", "nombre": "Martin Jesus"},
  };

  Future<bool> login(String userId, String password) async {
    final empleado = _empleados[userId];
    if (empleado == null || empleado["password"] != password) {
      return false;
    }
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString("userId", userId);
    await prefs.setString("userName", empleado["nombre"]!);
    return true;
  }

  Future<Map<String, String>?> getSession() async {
    final prefs = await SharedPreferences.getInstance();
    final userId = prefs.getString("userId");
    final userName = prefs.getString("userName");
    if (userId == null || userName == null) return null;
    return {"userId": userId, "userName": userName};
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
  }
}
