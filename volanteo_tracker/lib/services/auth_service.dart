import 'package:shared_preferences/shared_preferences.dart';

class AuthService {
  // Empleados hardcodeados para el MVP. Después esto puede venir de Mongo.
  static final Map<String, Map<String, String>> _empleados = {
    "emp001": {"password": "1234", "nombre": "Rodolfo Garrido", "plaza": "Yucatan"},
    "emp002": {"password": "1234", "nombre": "Jesus Espejo", "plaza": "Yucatan"},
    "emp003": {"password": "1234", "nombre": "Martin Jesus", "plaza": "Yucatan"},
    "emp004": {"password": "1234", "nombre": "Roberto Calva", "plaza": "Puebla"},
    "emp005": {"password": "1234", "nombre": "Elvia Davila", "plaza": "Tlaxcala"},
    "emp006": {"password": "1234", "nombre": "Obed Segura", "plaza": "Coatzacoalcos"},
    "emp007": {"password": "1234", "nombre": "Gilberto Nissin", "plaza": "Tuxpan"},
    "emp008": {"password": "1234", "nombre": "Manuel Pacheco", "plaza": "Villahermosa"},
  };

  Future<bool> login(String userId, String password) async {
    final empleado = _empleados[userId];
    if (empleado == null || empleado["password"] != password) {
      return false;
    }
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString("userId", userId);
    await prefs.setString("userName", empleado["nombre"]!);
    await prefs.setString("plaza", empleado["plaza"]!);
    return true;
  }

  Future<Map<String, String>?> getSession() async {
    final prefs = await SharedPreferences.getInstance();
    final userId = prefs.getString("userId");
    final userName = prefs.getString("userName");
    final plaza = prefs.getString("plaza");
    if (userId == null || userName == null || plaza == null) return null;
    return {"userId": userId, "userName": userName, "plaza": plaza};
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
  }
}
