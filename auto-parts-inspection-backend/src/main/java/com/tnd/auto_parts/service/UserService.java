package com.tnd.auto_parts.service;

import com.tnd.auto_parts.model.AppUser;
import com.tnd.auto_parts.model.Role;
import com.tnd.auto_parts.model.RoleName;
import com.tnd.auto_parts.repository.RoleRepository;
import com.tnd.auto_parts.repository.UserRepository;
import com.tnd.auto_parts.user.dto.UserRequest;
import com.tnd.auto_parts.user.dto.UserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::toUserResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserResponse createUser(UserRequest request) {
        if (userRepository.existsByUsername(request.getUsername().trim())) {
            throw new IllegalArgumentException("Username already exists: " + request.getUsername());
        }

        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new IllegalArgumentException("Password is required for new users");
        }

        Set<Role> roles = mapRoles(request.getRoles());

        AppUser user = AppUser.builder()
                .username(request.getUsername().trim())
                .password(passwordEncoder.encode(request.getPassword()))
                .roles(roles)
                .build();

        AppUser savedUser = userRepository.save(user);
        return toUserResponse(savedUser);
    }

    @Transactional
    public UserResponse updateUser(Long id, UserRequest request) {
        AppUser user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + id));

        String newUsername = request.getUsername().trim();
        if (!user.getUsername().equals(newUsername) && userRepository.existsByUsername(newUsername)) {
            throw new IllegalArgumentException("Username already exists: " + newUsername);
        }

        user.setUsername(newUsername);

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        Set<Role> roles = mapRoles(request.getRoles());
        user.setRoles(roles);

        AppUser updatedUser = userRepository.save(user);
        return toUserResponse(updatedUser);
    }

    @Transactional
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new IllegalArgumentException("User not found with ID: " + id);
        }
        userRepository.deleteById(id);
    }

    public List<String> getAllRoles() {
        return roleRepository.findAll().stream()
                .map(r -> r.getName().name())
                .collect(Collectors.toList());
    }

    private Set<Role> mapRoles(Set<String> roleStrings) {
        Set<Role> roles = new HashSet<>();
        for (String roleStr : roleStrings) {
            // Remove ROLE_ prefix if present, as RoleName values are plain (ADMIN, MANAGER, etc.)
            String cleanRoleStr = roleStr.replace("ROLE_", "").trim().toUpperCase();
            try {
                RoleName roleName = RoleName.valueOf(cleanRoleStr);
                Role role = roleRepository.findByName(roleName)
                        .orElseThrow(() -> new IllegalStateException("Role not found in DB: " + roleName));
                roles.add(role);
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid role: " + roleStr + ". Allowed roles: ADMIN, MANAGER, STAFF, SUPPLIER");
            }
        }
        return roles;
    }

    private UserResponse toUserResponse(AppUser user) {
        Set<String> roleNames = user.getRoles().stream()
                .map(r -> "ROLE_" + r.getName().name())
                .collect(Collectors.toSet());

        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .roles(roleNames)
                .build();
    }
}
