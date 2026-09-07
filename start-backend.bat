@echo off
echo Starting VoIP S&D Spring Boot Backend on http://localhost:8081 ...
cd /d %~dp0\backend
mvn spring-boot:run