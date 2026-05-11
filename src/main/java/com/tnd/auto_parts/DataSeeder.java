package com.tnd.auto_parts;

import com.tnd.auto_parts.model.Part;
import com.tnd.auto_parts.repository.PartRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {

    private final PartRepository partRepository;

    public DataSeeder(PartRepository partRepository) {
        this.partRepository = partRepository;
    }

    @Override
    public void run(String... args) {
        long count = partRepository.count();
        System.out.println("Current part count: " + count);
        if (count == 0) {
            List<Part> sampleParts = Arrays.asList(
                Part.builder().partCode("PT-001").partName("Má phanh trước").specifications("Chất liệu Ceramic, độ bền 50,000km").build(),
                Part.builder().partCode("PT-002").partName("Đĩa phanh sau").specifications("Chất liệu thép, đường kính 280mm").build(),
                Part.builder().partCode("PT-003").partName("Bugi đánh lửa").specifications("Loại Iridium, tuổi thọ 100,000km").build(),
                Part.builder().partCode("PT-004").partName("Lọc dầu động cơ").specifications("Công suất 2.0L, hiệu suất lọc 99%").build(),
                Part.builder().partCode("PT-005").partName("Dầu phanh").specifications("Loại DOT 4, dung tích 500ml").build(),
                Part.builder().partCode("PT-006").partName("Bộ lọc gió").specifications("Loại giấy, kích thước 25x20cm").build(),
                Part.builder().partCode("PT-007").partName("Lọc cabin").specifications("Loại than hoạt tính, tuổi thọ 15,000km").build(),
                Part.builder().partCode("PT-008").partName("Pin ô tô").specifications("Voltage 12V, Amperage 60Ah").build(),
                Part.builder().partCode("PT-009").partName("Chổi gạt nước").specifications("Loại silicone mềm, độ dài 600mm").build(),
                Part.builder().partCode("PT-010").partName("Dầu máy").specifications("SAE 5W-30, dung tích 4L").build(),
                Part.builder().partCode("PT-011").partName("Xăng điều hòa").specifications("R134a, dung tích 500ml").build(),
                Part.builder().partCode("PT-012").partName("Bóng đèn pha").specifications("H7 55W, 6000K").build(),
                Part.builder().partCode("PT-013").partName("Bóng đèn hậu").specifications("P21W 21W Ba15s").build(),
                Part.builder().partCode("PT-014").partName("Cao su chốt cửa").specifications("Cao su tổng hợp, dài 2m").build(),
                Part.builder().partCode("PT-015").partName("Bộ đệm xe").specifications("Lò xo, giảm xóc tích hợp").build(),
                Part.builder().partCode("PT-016").partName("Đai curoa").specifications("Loại V-belt, dài 1.5m").build(),
                Part.builder().partCode("PT-017").partName("Cảm biến ABS").specifications("Cảm biến từ, cự ly 2mm").build(),
                Part.builder().partCode("PT-018").partName("Cảm biến oxy").specifications("Loại zircon, 4 dây điện").build(),
                Part.builder().partCode("PT-019").partName("Động cơ quạt").specifications("12V DC, công suất 40W").build(),
                Part.builder().partCode("PT-020").partName("Relè điều khiển").specifications("12V 20A, 4 chân").build()
            );
            partRepository.saveAll(sampleParts);
            System.out.println("Sample data seeded successfully! Total: " + sampleParts.size() + " parts");
        } else {
            System.out.println("Data already exists, skipping seed.");
        }
    }
}
