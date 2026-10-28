@echo off
REM ============================================================================
REM Gửi báo cáo ngày qua Telegram (dùng cho Task Scheduler Windows)
REM ----------------------------------------------------------------------------
REM Task Scheduler -> Create Task:
REM   General : Run only when user is logged on / or with your user account
REM   Trigger : Daily at 21:00
REM   Action  : Program    = C:\Program Files\nodejs\node.exe
REM             Arguments  = "<path>\scripts\send-daily-report.mjs"
REM             Start in   = "<path>\lmc\Lmc-project"
REM ============================================================================

REM Đổi sang thư mục gốc project (để .env.local được nạp đúng)
cd /d "%~dp0.."

REM Tạo thư mục log nếu chưa có
if not exist "logs" mkdir "logs"

REM Chạy script, ghi log ra file
node "scripts\send-daily-report.mjs" >> "logs\daily-report.log" 2>&1

REM Giữ cửa sổ cmd lại khi chạy thủ công để xem log
if "%1"=="pause" pause
