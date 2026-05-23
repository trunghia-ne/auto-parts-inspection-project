package com.tnd.auto_parts.security;

import com.tnd.auto_parts.model.Role;
import com.tnd.auto_parts.model.RoleName;
import com.tnd.auto_parts.repository.RoleRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;

@Configuration
public class RoleSeeder {

    @Bean
    public CommandLineRunner seedRoles(RoleRepository roleRepository) {
        return args -> {
            Arrays.stream(RoleName.values()).forEach(roleName -> {
                roleRepository.findByName(roleName).orElseGet(() -> roleRepository.save(
                        Role.builder().name(roleName).build()
                ));
            });
        };
    }
}
