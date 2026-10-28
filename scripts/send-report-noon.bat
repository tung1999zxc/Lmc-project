@echo off
REM ============================================================================
REM Gửi báo cáo TRƯA 12:00 (giờ Việt Nam) qua Telegram
REM ----------------------------------------------------------------------------
REM Task Scheduler -> Create Task:
REM   General : Run whether user is logged on or not (bằng tài khoản của bạn)
REM             -> tick "Run with highest privileges" nếu muốn chạy khi máy khởi động
REM   Trigger : Daily at 12:00
REM   Action  : Program    = C:\Windows\System32\cmd.exe
REM             Arguments  = /c "<path>\scripts\send-report-noon.bat"
REM             Start in   = "<path>\lmc\Lmc-project"
REM ============================================================================

REM Đổi sang thư mục gốc project (để .env.local được nạp đúng)
cd /d "%~dp0.."

REM Tạo thư mục log nếu chưa có
if not exist "logs" mkdir "logs"

REM Chạy script, ghi log ra file
node "scripts\send-daily-report.mjs" --slot=noon >> "logs\daily-report-noon.log" 2>&1

REM Giữ cửa sổ cmd lại khi chạy thủ công để xem log
if "%1"=="pause" pause
