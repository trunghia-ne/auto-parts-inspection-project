package com.tnd.auto_parts.auth;

import com.tnd.auto_parts.auth.dto.AuthResponse;
import com.tnd.auto_parts.auth.dto.LoginRequest;
import com.tnd.auto_parts.auth.dto.RegisterRequest;
import com.tnd.auto_parts.model.AppUser;
import com.tnd.auto_parts.model.Role;
import com.tnd.auto_parts.model.RoleName;
import com.tnd.auto_parts.repository.RoleRepository;
import com.tnd.auto_parts.repository.UserRepository;
import com.tnd.auto_parts.security.JwtService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthController(
            AuthenticationManager authenticationManager,
            JwtService jwtService,
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {

        // 1. Validate Username
        if (userRepository.existsByUsername(request.username())) {
            throw new IllegalArgumentException("Tên đăng nhập đã tồn tại trong hệ thống!");
        }

        // 2. 🔥 Validate Email (Chỉ check nếu khách hàng có nhập email)
        if (request.email() != null && !request.email().isBlank()) {
            if (userRepository.existsByEmail(request.email())) {
                throw new IllegalArgumentException("Email này đã được sử dụng cho một tài khoản khác!");
            }
        }

        // 3. 🔥 Validate Mã số thuế (Tùy chọn: Chặn 1 doanh nghiệp tạo nhiều acc nếu cần)
        if (request.taxCode() != null && !request.taxCode().isBlank()) {
            if (userRepository.existsByTaxCode(request.taxCode())) {
                throw new IllegalArgumentException("Mã số thuế này đã được đăng ký!");
            }
        }

        RoleName roleName;
        if (request.role() == null || request.role().isBlank()) {
            roleName = RoleName.CUSTOMER;
        } else {
            try {
                roleName = RoleName.valueOf(request.role().trim().toUpperCase());
            } catch (IllegalArgumentException ex) {
                throw new IllegalArgumentException("Quyền không hợp lệ. Chỉ chấp nhận: ADMIN, QC, CUSTOMER");
            }
        }

        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new IllegalStateException("Không tìm thấy quyền: " + roleName));

        AppUser user = AppUser.builder()
                .username(request.username())
                .password(passwordEncoder.encode(request.password()))
                .companyName(request.companyName())
                .fullName(request.fullName())
                .email(request.email())
                .phoneNumber(request.phoneNumber())
                .taxCode(request.taxCode())
                .address(request.address())
                .build();

        user.getRoles().add(role);
        userRepository.save(user);

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username(), request.password())
        );

        return toAuthResponse(authentication);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username(), request.password())
        );
        return toAuthResponse(authentication);
    }

    private AuthResponse toAuthResponse(Authentication authentication) {
        UserDetails principal = (UserDetails) authentication.getPrincipal();
        String token = jwtService.generateToken(principal);
        Set<String> roles = principal.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toSet());
        return new AuthResponse(token, "Bearer", principal.getUsername(), roles);
    }
}