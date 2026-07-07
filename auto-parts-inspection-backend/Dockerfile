# Bước 1: Build ứng dụng với Maven và Temurin JDK 17
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

# Copy pom.xml trước để tận dụng cache của Docker cho các thư viện
COPY pom.xml .
RUN mvn dependency:go-offline

# Copy code và build sản phẩm
COPY src ./src
RUN mvn clean package -DskipTests

# Bước 2: Chạy ứng dụng với Temurin JRE 17 (giúp giảm dung lượng image)
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# CHÚ Ý: Đổi "auto-parts" thành đúng tên artifactId trong file pom.xml của bạn
COPY --from=build /app/target/auto-parts-*.jar app.jar

# Mở port (Render sẽ tự động map với biến ${PORT})
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]