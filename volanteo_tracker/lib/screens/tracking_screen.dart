import 'package:flutter/material.dart';
import 'package:flutter_background_service/flutter_background_service.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../services/location_service.dart';

class TrackingScreen extends StatefulWidget {
  const TrackingScreen({super.key});

  @override
  State<TrackingScreen> createState() => _TrackingScreenState();
}

class _TrackingScreenState extends State<TrackingScreen> {
  final _api = ApiService();
  bool _jornadaActiva = false;
  String? _userName;
  String? _jornadaId;

  @override
  void initState() {
    super.initState();
    _loadSession();
  }

  Future<void> _loadSession() async {
    final auth = AuthService();
    final session = await auth.getSession();
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _userName = session?["userName"];
      _jornadaId = prefs.getString("jornadaId");
      _jornadaActiva = _jornadaId != null;
    });
  }

  Future<void> _iniciarJornada() async {
    final granted = await requestLocationPermissions();
    if (!granted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Se necesita permiso de ubicación 'Permitir siempre'")),
      );
      return;
    }

    final prefs = await SharedPreferences.getInstance();
    final userId = prefs.getString("userId")!;
    final userName = prefs.getString("userName")!;

    final jornadaId = await _api.startJornada(userId, userName);
    if (jornadaId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("No se pudo iniciar la jornada. Revisa tu conexión.")),
      );
      return;
    }

    await prefs.setString("jornadaId", jornadaId);
    FlutterBackgroundService().startService();
    setState(() {
      _jornadaActiva = true;
      _jornadaId = jornadaId;
    });
  }

  Future<void> _finalizarJornada() async {
    final prefs = await SharedPreferences.getInstance();
    final jornadaId = prefs.getString("jornadaId");
    if (jornadaId != null) {
      await _api.endJornada(jornadaId);
      await prefs.remove("jornadaId");
    }
    FlutterBackgroundService().invoke("stopService");
    setState(() {
      _jornadaActiva = false;
      _jornadaId = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text("Hola, ${_userName ?? ''}")),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              _jornadaActiva ? Icons.location_on : Icons.location_off,
              size: 100,
              color: _jornadaActiva ? Colors.green : Colors.grey,
            ),
            const SizedBox(height: 24),
            Text(
              _jornadaActiva ? "Jornada en curso" : "Sin jornada activa",
              style: const TextStyle(fontSize: 20),
            ),
            const SizedBox(height: 32),
            SizedBox(
              width: 220,
              height: 60,
              child: ElevatedButton(
                onPressed: _jornadaActiva ? _finalizarJornada : _iniciarJornada,
                style: ElevatedButton.styleFrom(
                  backgroundColor: _jornadaActiva ? Colors.red : Colors.green,
                ),
                child: Text(
                  _jornadaActiva ? "Finalizar Jornada" : "Iniciar Jornada",
                  style: const TextStyle(fontSize: 18, color: Colors.white),
                ),
              ),
            ),
            if (_jornadaActiva && _jornadaId != null) ...[
              const SizedBox(height: 12),
              Text(
                _jornadaId!,
                style: const TextStyle(fontSize: 12, color: Colors.grey),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
