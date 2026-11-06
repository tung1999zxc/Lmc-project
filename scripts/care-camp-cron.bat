@echo off
REM ============================================================================
REM Care Camp — chạy nền & lưu báo cáo nhân viên hàng ngày
REM ----------------------------------------------------------------------------
REM Task Scheduler -> Create Task:
REM   General : Run only when user is logged on / or with your user account
REM   Trigger : Daily at 00:00
REM   Action  : Program    = C:\Program Files\nodejs\node.exe
REM             Arguments  = "<path>\scripts\care-camp-cron.mjs" --log=logs\care-camp.log
REM             Start in   = "<path>\lmc\Lmc-project"
REM
REM Script chạy liên tục, mỗi 10 phút lại snapshot + lưu báo cáo.
REM Nếu muốn chạy 1 lần rồi thoát (để Task Scheduler tự gọi định kỳ):
REM   node scripts\care-camp-cron.mjs --once --log=logs\care-camp.log
REM ============================================================================

REM Đổi sang thư mục gốc project (để .env.local được nạp đúng)
cd /d "%~dp0.."

REM Tạo thư mục log nếu chưa có
if not exist "logs" mkdir "logs"

REM Chạy nền (bỏ --once để chạy liên tục)
node "scripts\care-camp-cron.mjs" --log=logs\care-camp.log

REM Giữ cửa sổ cmd lại khi chạy thủ công để xem log
if "%1"=="pause" pause
