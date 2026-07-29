import 'dart:async';
import 'dart:ui';
import 'package:flutter_background_service/flutter_background_service.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:geolocator/geolocator.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/location_point.dart';
import 'api_service.dart';

const notificationChannelId = 'volanteo_tracking_channel';
const notificationId = 888;

Future<void> initializeBackgroundService() async {
  final service = FlutterBackgroundService();

  const androidChannel = AndroidNotificationChannel(
    notificationChannelId,
    'Tracking Volanteo',
    description: 'Rastreo activo de jornada',
    importance: Importance.low,
  );

  final flnp = FlutterLocalNotificationsPlugin();
  await flnp
      .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
      ?.createNotificationChannel(androidChannel);

  await service.configure(
    androidConfiguration: AndroidConfiguration(
      onStart: onServiceStart,
      autoStart: false,
      isForegroundMode: true,
      notificationChannelId: notificationChannelId,
      initialNotificationTitle: 'Jornada activa',
      initialNotificationContent: 'Rastreando ubicación...',
      foregroundServiceNotificationId: notificationId,
    ),
    iosConfiguration: IosConfiguration(), // no se usa en este MVP
  );
}

@pragma('vm:entry-point')
void onServiceStart(ServiceInstance service) async {
  DartPluginRegistrant.ensureInitialized();

  final api = ApiService();
  final prefs = await SharedPreferences.getInstance();
  final userId = prefs.getString("userId") ?? "";
  final userName = prefs.getString("userName") ?? "";
  final jornadaId = prefs.getString("jornadaId") ?? "";

  Position? lastSentPosition;
  DateTime lastSentTime = DateTime.now();

  service.on('stopService').listen((event) {
    service.stopSelf();
  });

  // Stream continuo de ubicación con filtro de distancia mínima nativo
  const locationSettings = LocationSettings(
    accuracy: LocationAccuracy.high,
    distanceFilter: 20, // el SO ya filtra ruido menor a 20m
  );

  StreamSubscription<Position>? positionStream;

  positionStream = Geolocator.getPositionStream(locationSettings: locationSettings)
      .listen((Position position) async {
    final now = DateTime.now();
    final secondsSinceLastSend = now.difference(lastSentTime).inSeconds;

    bool shouldSend = false;

    if (lastSentPosition == null) {
      shouldSend = true;
    } else {
      final distance = Geolocator.distanceBetween(
        lastSentPosition!.latitude,
        lastSentPosition!.longitude,
        position.latitude,
        position.longitude,
      );
      // Regla: cada 3 minutos O cada 100 metros, lo que ocurra primero
      if (distance >= 100 || secondsSinceLastSend >= 180) {
        shouldSend = true;
      }
    }

    if (shouldSend) {
      final point = LocationPoint(
        userId: userId,
        userName: userName,
        jornadaId: jornadaId,
        lat: position.latitude,
        lng: position.longitude,
        timestamp: now,
      );
      final sent = await api.sendLocation(point);
      if (sent) {
        lastSentPosition = position;
        lastSentTime = now;
      }
    }

    if (service is AndroidServiceInstance) {
      service.setForegroundNotificationInfo(
        title: "Jornada activa - $userName",
        content: "Última ubicación: ${now.hour}:${now.minute.toString().padLeft(2, '0')}",
      );
    }
  });
}

Future<bool> requestLocationPermissions() async {
  bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
  if (!serviceEnabled) return false;

  LocationPermission permission = await Geolocator.checkPermission();
  if (permission == LocationPermission.denied) {
    permission = await Geolocator.requestPermission();
    if (permission == LocationPermission.denied) return false;
  }

  if (permission == LocationPermission.deniedForever) return false;

  // Crítico para background: pedir el permiso "Always" por separado
  if (permission == LocationPermission.whileInUse) {
    permission = await Geolocator.requestPermission();
  }

  return permission == LocationPermission.always ||
      permission == LocationPermission.whileInUse;
}
