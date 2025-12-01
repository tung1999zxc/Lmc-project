"use client";
import { useState, useEffect } from "react";

const PraiseBanner = ({ top5Employees }) => {
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (top5Employees.length === 0) return;

//   const phrasesTop1 = [
//       "Nguyễn Bá Cương ơi, sinh nhật thì phải đãi, không đãi thì chưa trọn vẹn ngày vui đâu nha!",
// "Nguyễn Bá Cương sinh nhật tuổi mới, một chầu linh đình mới hợp tình hợp lý!",
// "Nguyễn Bá Cương hôm nay mà không bao thì chắc mai tụi này buồn cả tuần luôn á!",
// "Nguyễn Bá Cương muốn lưu dấu kỷ niệm đẹp thì bàn nhậu là lựa chọn số 1 rồi!",
// "Nguyễn Bá Cương mà bao thì anh em nhớ cả đời, không bao thì anh em cũng… nhớ cả đời! 🤣",
// "Nguyễn Bá Cương cứ thoải mái đi, vì bao ăn bao uống hôm nay là đầu tư cho hạnh phúc tập thể!",
// "Nguyễn Bá Cương ơi, hôm nay ví của bạn sinh ra chỉ để thanh toán hóa đơn thôi!",
// "Nguyễn Bá Cương mời một bữa, anh em sẽ chúc ngàn lời!",
// "Nguyễn Bá Cương mà bao thì năm nay phúc lộc đầy nhà luôn!",
// "Nguyễn Bá Cương nên hiểu, bánh kem chỉ làm no mắt, còn bia thịt mới làm no bụng!",
// "Nguyễn Bá Cương tuổi mới, bao nhiêu ước mơ thì tùy, còn ước mơ của anh em là được bao ăn bao uống!",
// "Nguyễn Bá Cương mà bao thì từ nay danh hiệu 'chơi đẹp' thuộc về bạn!",
// "Nguyễn Bá Cương thử nghĩ xem, ngày sinh nhật mà chỉ uống nước lọc thì buồn biết bao!",
// "Nguyễn Bá Cương mà mời một kèo, hôm nay thành ngày huyền thoại ngay!",
// "Nguyễn Bá Cương bao một bữa thôi, lời chúc của tụi này sẽ dài cả năm!",
// "Nguyễn Bá Cương mà keo quá thì bánh kem cũng thành… bánh mì khô mất!",
// "Nguyễn Bá Cương tuổi mới thêm ga lăng, cứ bao mạnh tay để anh em thấy vui!",
// "Nguyễn Bá Cương hãy biến ngày sinh nhật thành ngày ăn nhậu kỷ niệm đi!",
// "Nguyễn Bá Cương nhớ nha, sinh nhật là ngày của bạn, nhưng bàn tiệc là của anh em!",
// "Nguyễn Bá Cương chỉ cần nói một câu 'anh bao tất', là tụi này chúc tới sáng luôn!","Nguyễn Bá Cương ơi, bỏ ra một tờ 500 thôi là anh em tự động xếp hàng lo hết!",
// "Nguyễn Bá Cương chỉ cần rút tờ 500, phần còn lại tụi này coi như nhiệm vụ!",
// "Nguyễn Bá Cương tuổi mới, chi 500 là đủ để anh em biến ngày hôm nay thành huyền thoại!",
// "Nguyễn Bá Cương ơi, 500 thì nhỏ nhưng niềm vui thì to!",
// "Nguyễn Bá Cương chỉ cần đưa 500, còn lại để anh em xoay sở!",
// "Nguyễn Bá Cương bỏ 500 ra là coi như đãi nguyên team rồi đó!",
// "Nguyễn Bá Cương tuổi mới thêm may mắn, chỉ cần 500 để mở màn!",
// "Nguyễn Bá Cương thử nghĩ coi, 500 đổi lấy tiếng cười cả hội – quá hời còn gì!",
// "Nguyễn Bá Cương cầm 500 như thắp sáng cả bàn tiệc vậy!",
// "Nguyễn Bá Cương ơi, 500 là tín hiệu, anh em sẽ tự động vào guồng lo tiếp!",
// "Nguyễn Bá Cương chỉ cần chìa 500, anh em coi như đủ lý do để quẩy tới bến!",
// "Nguyễn Bá Cương, 500 không làm bạn nghèo đi, nhưng làm cả hội giàu niềm vui!",
// "Nguyễn Bá Cương đưa 500 thôi, phần còn lại để tụi này 'chăm sóc hậu cần'!",
// "Nguyễn Bá Cương chi 500 là có ngay kỷ niệm nhớ đời!",
// "Nguyễn Bá Cương, 500 giống như chìa khóa mở cánh cửa tới bàn nhậu!",
// "Nguyễn Bá Cương mà tung ra tờ 500, anh em sẽ tung hô suốt cả năm!",
// "Nguyễn Bá Cương, 500 là vé thông hành để cả hội bay vào quán!",
// "Nguyễn Bá Cương ơi, 500 nhẹ nhàng thôi nhưng vui thì nặng trĩu!",
// "Nguyễn Bá Cương, chỉ cần 500 là đủ thấy bạn ga lăng nhất đêm nay!",
// "Nguyễn Bá Cương bỏ ra 500, còn lại để anh em bao trọn gói!"

     
     

//     ];
  const phrasesTop1 = [
      "{{name}} Hãy để doanh số hôm nay trở thành kỷ niệm đáng nhớ của bạn!",
      "Hãy tiếp tục giữ vững phong độ như {{name}} nhé cả nhà!",
      "{{name}} đang viết nên câu chuyện thành công mới cho team!",
      "{{name}}, bạn đã chứng minh đẳng cấp của mình!",
      "Chúng tôi tự hào khi có {{name}} trong đội!",
      "{{name}} đang chứng minh: tốc độ + kiên trì = thành công!",
      "Một ngày đầy năng lượng và doanh số cho {{name}}!",
      "Sáng nay {{name}} đứng giữa bảng xếp hạng, giờ thì top 1 rồi!",
      "Ai có thể ngăn nổi tốc độ của {{name}} hôm nay?",
      "Bước nhảy doanh số của {{name}} khiến BXH nóng rực!",
      "Hãy lấy tinh thần của {{name}} làm động lực để bứt phá!",
      "Ai muốn vào top hôm nay, hãy học cách {{name}} bứt phá!",
      "Team đang nóng lên nhờ cú bứt của {{name}}!",
      "{{name}} đã chứng minh rằng chăm chỉ là vũ khí mạnh nhất!",
      "Một ngày đẹp trời cho {{name}} và toàn bộ team MKT!",
      "Liệu {{name}} có giữ được vị trí đến cuối ngày?",
      "💰 {{name}} hút tiền về công ty như nam châm hút sắt!  ",
      "⚡ {{name}} chốt đơn nhanh hơn cả tia chớp!",
      "🎯 {{name}} bắn phát nào trúng đơn phát đó!",
      "🐉 {{name}} quẩy doanh số như rồng cuộn mây bay!",
      "🍀 {{name}} may mắn và tài năng kết hợp hoàn hảo!",
      "🕹 {{name}} điều khiển doanh số như chơi game!",
      "🍩 {{name}} thêm “đường” vào doanh số cho ngọt!",
      "🥶 {{name}} làm lạnh túi tiền khách nhưng làm nóng doanh số!",
    
      "Bản lĩnh MKT là đây – và {{name}} chính là hình mẫu!",
      "Từ một người ít nói, {{name}} đã vươn mình mạnh mẽ qua từng ngày!",
      "{{name}} không chỉ đang tăng doanh số – bạn đang tạo dấu ấn cá nhân.",
      "Ai sẽ vượt qua {{name}}? Thử thách đã được đặt ra!",
      "Chính nỗ lực thầm lặng của {{name}} đang tạo nên sự khác biệt lớn!",
      "Khi người khác nghỉ ngơi, {{name}} vẫn không ngừng tiến lên!",
      "Trưa rồi nhưng {{name}} vẫn chưa có dấu hiệu chậm lại!",
      "{{name}} đang dẫn đầu doanh số hôm nay ! Quá xuất sắc!",
      "Mỗi đơn hàng của {{name}} là một bước tiến cho công ty.",
      "Từng con số của bạn là từng viên gạch xây dựng thành công.",
      "Đừng dừng lại nhé {{name}}, bạn đang đi đúng hướng!",
      "Xin chúc mừng {{name}}, top 1 doanh số tính đến thời điểm này!",
      "Doanh số hôm nay đang gọi tên {{name}} – đỉnh cao MKT!",
      "Tập thể chúng ta đang lớn mạnh nhờ những ngôi sao như {{name}}!",
      "{{name}} không chỉ bán tốt, còn truyền cảm hứng cho cả team!",
      "Tinh thần và kết quả của {{name}} là động lực cho cả bộ phận MKT!",
      "Không ai ngờ {{name}} lại lật ngược tình thế nhanh đến vậy!",
      "🎤 {{name}} hát bản hit “Doanh số là đam mê”!",
      "🧨 {{name}} bùng nổ doanh số bất ngờ!",
      "🎢 {{name}} lái tàu lượn doanh số lên đỉnh!",
      "🥤 {{name}} uống “nước doanh số” không ngừng!",
      "🥊 {{name}} hạ knock-out mọi đối thủ doanh số!",
      "🧗 {{name}} leo đỉnh doanh số nhanh nhất hôm nay!",
      "🧨 {{name}} kích nổ doanh số bất ngờ!",
      "🏹 {{name}} nhắm đâu trúng đó, toàn đơn ngon!",
      "🌠 {{name}} là ngôi sao băng doanh số hôm nay!",
      "🧲 {{name}} hút khách về như nam châm!",
      "🪵 {{name}} góp từng “củi” vào lửa doanh số!",
      "🥗 {{name}} trộn đều bí quyết thành công và doanh số!",
      "🦦 {{name}} ôm trọn mọi đơn ngon!",
     

    ];

    const phrases15tr = [
     
      "Nếu hôm nay bạn mệt, hãy nhìn doanh số của {{name}} – cảm hứng là đây!",
      "Ai đang cần cảm hứng? Hãy nhìn vào doanh số của {{name}}!",
      "{{name}} là minh chứng cho việc: nỗ lực không bao giờ phản bội!",
    
       "{{name}} Hãy để doanh số hôm nay trở thành kỷ niệm đáng nhớ của bạn!",
      "Hãy tiếp tục giữ vững phong độ như {{name}} nhé cả nhà!",
      "{{name}} đang viết nên câu chuyện thành công mới cho team!",
      "{{name}}, bạn đã chứng minh đẳng cấp của mình!",
      "Chúng tôi tự hào khi có {{name}} trong đội!",
      "{{name}} đang chứng minh: tốc độ + kiên trì = thành công!",
      "Một ngày đầy năng lượng và doanh số cho {{name}}!",
      "Sáng nay {{name}} đứng giữa bảng xếp hạng, giờ thì top 1 rồi!",
      "Ai có thể ngăn nổi tốc độ của {{name}} hôm nay?",
      "Bước nhảy doanh số của {{name}} khiến BXH nóng rực!",
      "Hãy lấy tinh thần của {{name}} làm động lực để bứt phá!",
      "Ai muốn vào top hôm nay, hãy học cách {{name}} bứt phá!",
      "Team đang nóng lên nhờ cú bứt của {{name}}!",
      "{{name}} đã chứng minh rằng chăm chỉ là vũ khí mạnh nhất!",
      "Một ngày đẹp trời cho {{name}} và toàn bộ team MKT!",
      "Liệu {{name}} có giữ được vị trí đến cuối ngày?",
      "💰 {{name}} hút tiền về công ty như nam châm hút sắt!  ",
      "⚡ {{name}} chốt đơn nhanh hơn cả tia chớp!",
      "🎯 {{name}} bắn phát nào trúng đơn phát đó!",
      "🐉 {{name}} quẩy doanh số như rồng cuộn mây bay!",
      "🍀 {{name}} may mắn và tài năng kết hợp hoàn hảo!",
      "🕹 {{name}} điều khiển doanh số như chơi game!",
      "🍩 {{name}} thêm “đường” vào doanh số cho ngọt!",
      "🥶 {{name}} làm lạnh túi tiền khách nhưng làm nóng doanh số!",
    
      "Bản lĩnh MKT là đây – và {{name}} chính là hình mẫu!",
      "Từ một người ít nói, {{name}} đã vươn mình mạnh mẽ qua từng ngày!",
      "{{name}} không chỉ đang tăng doanh số – bạn đang tạo dấu ấn cá nhân.",
      "Ai sẽ vượt qua {{name}}? Thử thách đã được đặt ra!",
      "Chính nỗ lực thầm lặng của {{name}} đang tạo nên sự khác biệt lớn!",
      "Khi người khác nghỉ ngơi, {{name}} vẫn không ngừng tiến lên!",
      "Trưa rồi nhưng {{name}} vẫn chưa có dấu hiệu chậm lại!",
      "{{name}} đang dẫn đầu doanh số hôm nay ! Quá xuất sắc!",
      "Mỗi đơn hàng của {{name}} là một bước tiến cho công ty.",
      "Từng con số của bạn là từng viên gạch xây dựng thành công.",
      "Đừng dừng lại nhé {{name}}, bạn đang đi đúng hướng!",
      "Xin chúc mừng {{name}}, top 1 doanh số tính đến thời điểm này!",
      "Doanh số hôm nay đang gọi tên {{name}} – đỉnh cao MKT!",
      "Tập thể chúng ta đang lớn mạnh nhờ những ngôi sao như {{name}}!",
      "{{name}} không chỉ bán tốt, còn truyền cảm hứng cho cả team!",
      "Tinh thần và kết quả của {{name}} là động lực cho cả bộ phận MKT!",
      "Không ai ngờ {{name}} lại lật ngược tình thế nhanh đến vậy!",
      "🎤 {{name}} hát bản hit “Doanh số là đam mê”!",
      "🧨 {{name}} bùng nổ doanh số bất ngờ!",
      "🎢 {{name}} lái tàu lượn doanh số lên đỉnh!",
      "🥤 {{name}} uống “nước doanh số” không ngừng!",
      "🥊 {{name}} hạ knock-out mọi đối thủ doanh số!",
      "🧗 {{name}} leo đỉnh doanh số nhanh nhất hôm nay!",
      "🧨 {{name}} kích nổ doanh số bất ngờ!",
      "🏹 {{name}} nhắm đâu trúng đó, toàn đơn ngon!",
      "🌠 {{name}} là ngôi sao băng doanh số hôm nay!",
      "🧲 {{name}} hút khách về như nam châm!",
      "🪵 {{name}} góp từng “củi” vào lửa doanh số!",
      "🥗 {{name}} trộn đều bí quyết thành công và doanh số!",
      "🦦 {{name}} ôm trọn mọi đơn ngon!",
      
      "Tăng trưởng liên tục! {{name}} đang trở thành hình mẫu lý tưởng!",
      
      
      "Hôm nay, {{name}} đã khẳng định vị thế bằng doanh số vượt trội!",
      "Vượt mốc lớn giữa ngày – {{name}} đang chơi ở một đẳng cấp khác!",
      "🔥 {{name}} làm doanh số nóng rực cả bảng xếp hạng!",
      "📈 {{name}} kéo biểu đồ doanh số lên như leo núi!",
      "🐼 {{name}} dễ thương nhưng doanh số thì cực gắt!",
      "🎬 {{name}} đóng vai chính trong bộ phim “Doanh số triệu view”!",
      "🦖 {{name}} cắn nát mọi mục tiêu doanh số!",
      "🥶 {{name}} làm lạnh túi tiền khách nhưng làm nóng doanh số!",
      "🚜 {{name}} cày doanh số như cày ruộng!",
      "🚧 {{name}} phá mọi rào cản doanh số!",
      "🌱 {{name}} gieo hạt doanh số hôm nay, gặt vàng ngày mai!",
      "🌌 {{name}} chiếu sáng cả bầu trời doanh số!",
      "🧯 {{name}} dập tắt mọi lo âu, thổi bùng doanh số!",
    
      "⚡ {{name}} chốt đơn nhanh hơn cả tia chớp!",
      "🏆 {{name}} giữ cúp “Thánh chốt đơn” hôm nay!",
      "🍯 {{name}} ngọt ngào như mật ong, khách mê tít!",
      "🦅 {{name}} săn đơn từ xa, không trượt phát nào!",
      "🛠 {{name}} sửa mọi lý do khách từ chối thành chốt đơn!",
      "🛸 {{name}} chốt đơn bay cao hơn UFO!",
      "🐋 {{name}} nuốt trọn đơn to!",
      "🥷 {{name}} chốt đơn âm thầm nhưng cực chất!",
      "🏹 {{name}} bắn mũi tên doanh số xuyên tim khách!",
      "🪄 {{name}} biến phép thuật thành đơn hàng!",
      "🧊 {{name}} làm tan băng mọi khách khó tính!",
      "🥇 {{name}} xứng đáng huy chương vàng chốt đơn!",
      "🐕 {{name}} săn đơn như chó săn thỏ!",
      "🐍 {{name}} luồn lách chốt đơn cực mượt!",
      "🐙 {{name}} ôm trọn mọi cơ hội chốt đơn!",
      "🔑 {{name}} mở khóa mọi khách hàng khó tính!",
      "🛎 {{name}} rung chuông doanh số liên tục!",
      "🥡 {{name}} gói ghém doanh số gọn gàng đem về!",
      "🧃 {{name}} ép nước từ mọi cơ hội doanh số!",
      "🎩 {{name}} ảo thuật gia biến khách lạ thành khách quen!",
 
    ];

    const phrases20tr = [
     "Nếu hôm nay bạn mệt, hãy nhìn doanh số của {{name}} – cảm hứng là đây!",
      "Ai đang cần cảm hứng? Hãy nhìn vào doanh số của {{name}}!",
      "{{name}} là minh chứng cho việc: nỗ lực không bao giờ phản bội!",
     "{{name}} Hãy để doanh số hôm nay trở thành kỷ niệm đáng nhớ của bạn!",
      "Hãy tiếp tục giữ vững phong độ như {{name}} nhé cả nhà!",
      "{{name}} đang viết nên câu chuyện thành công mới cho team!",
      "{{name}}, bạn đã chứng minh đẳng cấp của mình!",
      "Chúng tôi tự hào khi có {{name}} trong đội!",
      "{{name}} đang chứng minh: tốc độ + kiên trì = thành công!",
      "Một ngày đầy năng lượng và doanh số cho {{name}}!",
      "Sáng nay {{name}} đứng giữa bảng xếp hạng, giờ thì top 1 rồi!",
      "Ai có thể ngăn nổi tốc độ của {{name}} hôm nay?",
      "Bước nhảy doanh số của {{name}} khiến BXH nóng rực!",
      "Hãy lấy tinh thần của {{name}} làm động lực để bứt phá!",
      "Ai muốn vào top hôm nay, hãy học cách {{name}} bứt phá!",
      "Team đang nóng lên nhờ cú bứt của {{name}}!",
      "{{name}} đã chứng minh rằng chăm chỉ là vũ khí mạnh nhất!",
      "Một ngày đẹp trời cho {{name}} và toàn bộ team MKT!",
      "Liệu {{name}} có giữ được vị trí đến cuối ngày?",
      "💰 {{name}} hút tiền về công ty như nam châm hút sắt!  ",
      "⚡ {{name}} chốt đơn nhanh hơn cả tia chớp!",
      "🎯 {{name}} bắn phát nào trúng đơn phát đó!",
      "🐉 {{name}} quẩy doanh số như rồng cuộn mây bay!",
      "🍀 {{name}} may mắn và tài năng kết hợp hoàn hảo!",
      "🕹 {{name}} điều khiển doanh số như chơi game!",
      "🍩 {{name}} thêm “đường” vào doanh số cho ngọt!",
      "🥶 {{name}} làm lạnh túi tiền khách nhưng làm nóng doanh số!",
    
      "Bản lĩnh MKT là đây – và {{name}} chính là hình mẫu!",
      "Từ một người ít nói, {{name}} đã vươn mình mạnh mẽ qua từng ngày!",
      "{{name}} không chỉ đang tăng doanh số – bạn đang tạo dấu ấn cá nhân.",
      "Ai sẽ vượt qua {{name}}? Thử thách đã được đặt ra!",
      "Chính nỗ lực thầm lặng của {{name}} đang tạo nên sự khác biệt lớn!",
      "Khi người khác nghỉ ngơi, {{name}} vẫn không ngừng tiến lên!",
      "Trưa rồi nhưng {{name}} vẫn chưa có dấu hiệu chậm lại!",
      "{{name}} đang dẫn đầu doanh số hôm nay ! Quá xuất sắc!",
      "Mỗi đơn hàng của {{name}} là một bước tiến cho công ty.",
      "Từng con số của bạn là từng viên gạch xây dựng thành công.",
      "Đừng dừng lại nhé {{name}}, bạn đang đi đúng hướng!",
      "Xin chúc mừng {{name}}, top 1 doanh số tính đến thời điểm này!",
      "Doanh số hôm nay đang gọi tên {{name}} – đỉnh cao MKT!",
      "Tập thể chúng ta đang lớn mạnh nhờ những ngôi sao như {{name}}!",
      "{{name}} không chỉ bán tốt, còn truyền cảm hứng cho cả team!",
      "Tinh thần và kết quả của {{name}} là động lực cho cả bộ phận MKT!",
      "Không ai ngờ {{name}} lại lật ngược tình thế nhanh đến vậy!",
      "🎤 {{name}} hát bản hit “Doanh số là đam mê”!",
      "🧨 {{name}} bùng nổ doanh số bất ngờ!",
      "🎢 {{name}} lái tàu lượn doanh số lên đỉnh!",
      "🥤 {{name}} uống “nước doanh số” không ngừng!",
      "🥊 {{name}} hạ knock-out mọi đối thủ doanh số!",
      "🧗 {{name}} leo đỉnh doanh số nhanh nhất hôm nay!",
      "🧨 {{name}} kích nổ doanh số bất ngờ!",
      "🏹 {{name}} nhắm đâu trúng đó, toàn đơn ngon!",
      "🌠 {{name}} là ngôi sao băng doanh số hôm nay!",
      "🧲 {{name}} hút khách về như nam châm!",
      "🪵 {{name}} góp từng “củi” vào lửa doanh số!",
      "🥗 {{name}} trộn đều bí quyết thành công và doanh số!",
      "🦦 {{name}} ôm trọn mọi đơn ngon!",
      
      
      "Tăng trưởng liên tục! {{name}} đang trở thành hình mẫu lý tưởng!",
      
      
      "Hôm nay, {{name}} đã khẳng định vị thế bằng doanh số vượt trội!",
      "Vượt mốc lớn giữa ngày – {{name}} đang chơi ở một đẳng cấp khác!",
      "🔥 {{name}} làm doanh số nóng rực cả bảng xếp hạng!",
      "📈 {{name}} kéo biểu đồ doanh số lên như leo núi!",
      "🐼 {{name}} dễ thương nhưng doanh số thì cực gắt!",
      "🎬 {{name}} đóng vai chính trong bộ phim “Doanh số triệu view”!",
      "🦖 {{name}} cắn nát mọi mục tiêu doanh số!",
      "🥶 {{name}} làm lạnh túi tiền khách nhưng làm nóng doanh số!",
      "🚜 {{name}} cày doanh số như cày ruộng!",
      "🚧 {{name}} phá mọi rào cản doanh số!",
      "🌱 {{name}} gieo hạt doanh số hôm nay, gặt vàng ngày mai!",
      "🌌 {{name}} chiếu sáng cả bầu trời doanh số!",
      "🧯 {{name}} dập tắt mọi lo âu, thổi bùng doanh số!",
    
      "⚡ {{name}} chốt đơn nhanh hơn cả tia chớp!",
      "🏆 {{name}} giữ cúp “Thánh chốt đơn” hôm nay!",
      "🍯 {{name}} ngọt ngào như mật ong, khách mê tít!",
      "🦅 {{name}} săn đơn từ xa, không trượt phát nào!",
      "🛠 {{name}} sửa mọi lý do khách từ chối thành chốt đơn!",
      "🛸 {{name}} chốt đơn bay cao hơn UFO!",
      "🐋 {{name}} nuốt trọn đơn to!",
      "🥷 {{name}} chốt đơn âm thầm nhưng cực chất!",
      "🏹 {{name}} bắn mũi tên doanh số xuyên tim khách!",
      "🪄 {{name}} biến phép thuật thành đơn hàng!",
      "🧊 {{name}} làm tan băng mọi khách khó tính!",
      "🥇 {{name}} xứng đáng huy chương vàng chốt đơn!",
      "🐕 {{name}} săn đơn như chó săn thỏ!",
      "🐍 {{name}} luồn lách chốt đơn cực mượt!",
      "🐙 {{name}} ôm trọn mọi cơ hội chốt đơn!",
      "🔑 {{name}} mở khóa mọi khách hàng khó tính!",
      "🛎 {{name}} rung chuông doanh số liên tục!",
      "🥡 {{name}} gói ghém doanh số gọn gàng đem về!",
      "🧃 {{name}} ép nước từ mọi cơ hội doanh số!",
      "🎩 {{name}} ảo thuật gia biến khách lạ thành khách quen!",
      "{{name}} là minh chứng cho việc: nỗ lực không bao giờ phản bội!",
      "{{name}} đã làm được điều mà ít ai dám nghĩ tới hôm nay!",
      
      "Doanh số – {{name}} đang tiến gần kỷ lục của tháng!",
      "Chỉ trong 1 ngày, {{name}} đã đạt gấp đôi mục tiêu!"
    ];

    const phrasesTop2 = [
      "Đừng dừng lại nhé {{name}}, bạn đang đi đúng hướng!",
      "🦄 {{name}} cưỡi kỳ lân bay vào bảng vàng doanh số!", 
      "Mỗi phút trôi qua, {{name}} lại tiến gần hơn đến vị trí số 1!",
      "{{name}} đang bám rất sát Top 1 Server , cuộc đua doanh số cực kỳ gay cấn!",
   
    ];

    const phrasesTop3 = [
      "Đừng dừng lại nhé {{name}}, bạn đang đi đúng hướng!",
      "🦄 {{name}} cưỡi kỳ lân bay vào bảng vàng doanh số!",
    ];

    function getPraiseText(rank, name, sales) {
      const salesDisplay = sales.toLocaleString("vi-VN") + " VNĐ";
      if (rank === 0) {
        if (sales > 30000000 || sales > 20000000) {
          return replace(getRandomItem(phrases20tr), name, salesDisplay);
        } else if (sales > 15000000) {
          return replace(getRandomItem(phrases15tr), name, salesDisplay);
        } else {
          return replace(getRandomItem(phrasesTop1), name, salesDisplay);
        }
      } else if (rank === 1) {
        return replace(getRandomItem(phrasesTop2), name, salesDisplay);
      } else if (rank === 2) {
        return replace(getRandomItem(phrasesTop3), name, salesDisplay);
      }
      return "";
    }

    function getRandomItem(arr) {
      return arr[Math.floor(Math.random() * arr.length)];
    }

    function replace(template, name, sales) {
      return template.replace(/{{name}}/g, name).replace(/{{sales}}/g, sales);
    }

    function generateMessage() {
      const index = Math.floor(Math.random() * Math.min(top5Employees.length, 3));
      const emp = top5Employees[index];
      return getPraiseText(index, emp.name, emp.totalToday * 17000);
    }

    // Gọi lần đầu
    setMessage(generateMessage());

    // Đổi câu mỗi 20 giây
    const interval = setInterval(() => {
      setMessage(generateMessage());
    }, 30000);

    return () => clearInterval(interval);
  }, [top5Employees]);

  if (top5Employees.length === 0 || !message) return null;

 return (
  <>
    <style jsx>{`
      @keyframes slide-left {
        -20% {
          transform: translateX(80%);
        }
        100% {
          transform: translateX(-80%);
        }
      }
      .marquee-container {
        width: 100%;
        overflow: hidden;
        height: 80px;
        background: linear-gradient(90deg, #bfda5eff, #ace237ff);
        border: 1px solid #73e312ff;
        border-radius: 10px;
        padding: 10px 0;
        margin-bottom: 12px;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
      }
      .marquee-text {
        display: inline-block;
        white-space: nowrap;
        animation: slide-left 29s linear infinite;
        font-weight: 700;
        font-size: 32px;
        color: #f60112ff;
        padding-left: 100%;
      }
      .highlight-name {
        color: #0fff02e1;
        font-weight: 1500;
        text-shadow: 1px 1px 2px rgba(45, 48, 185, 0.15);
      }
    `}</style>
    <div className="marquee-container">
      <div
        className="marquee-text"
        dangerouslySetInnerHTML={{
          __html: message.replace(
            /(\S+)/, // tạm thời chỉ highlight từ đầu tiên nếu là tên
            `<span class="highlight-name">$1</span>`
          ),
        }}
      />
    </div>
  </>
);
};

export default PraiseBanner;
