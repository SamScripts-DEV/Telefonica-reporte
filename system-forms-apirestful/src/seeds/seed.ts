import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Role } from '../entities/role.entity';
import { Tower } from '../entities/tower.entity';
import { User } from '../entities/user.entity';
import { Permission } from '../entities/permission.entity';
import { Group } from '../entities/group.entity';

export async function seedDatabase(dataSource: DataSource) {
  console.log('🌱 Starting database seeding...');

  const roleRepository = dataSource.getRepository(Role);
  const towerRepository = dataSource.getRepository(Tower);
  const userRepository = dataSource.getRepository(User);
  const permissionRepository = dataSource.getRepository(Permission);
  const groupRepository = dataSource.getRepository(Group);

  // Seed Roles
  const roles = [
    { name: 'dev' },
    { name: 'superadmin' },
    { name: 'pm' },
    { name: 'jefe' },
    { name: 'evaluador' },
    { name: 'tecnico' },
  ];

  console.log('📝 Creating roles...');
  const savedRoles: Role[] = [];
  for (const roleData of roles) {
    let role = await roleRepository.findOne({ where: { name: roleData.name } });
    if (!role) {
      role = roleRepository.create(roleData);
      role = await roleRepository.save(role);
    }
    savedRoles.push(role);
  }

  // Seed Towers
  const towers = [
    { name: 'Torre Norte' },
    { name: 'Torre Sur' },
    { name: 'Torre Este' },
    { name: 'Torre Oeste' },
    { name: 'Torre Central' },
  ];

  console.log('🏗️ Creating towers...');
  const savedTowers: Tower[] = [];
  for (const towerData of towers) {
    let tower = await towerRepository.findOne({ where: { name: towerData.name } });
    if (!tower) {
      tower = towerRepository.create(towerData);
      tower = await towerRepository.save(tower);
    }
    savedTowers.push(tower);
  }

  // Seed Permissions
  const permissions = [
    { resource: 'users', action: 'create' },
    { resource: 'users', action: 'read' },
    { resource: 'users', action: 'update' },
    { resource: 'users', action: 'delete' },
    { resource: 'roles', action: 'create' },
    { resource: 'roles', action: 'read' },
    { resource: 'roles', action: 'update' },
    { resource: 'roles', action: 'delete' },
    { resource: 'towers', action: 'create' },
    { resource: 'towers', action: 'read' },
    { resource: 'towers', action: 'update' },
    { resource: 'towers', action: 'delete' },
    { resource: 'technicians', action: 'create' },
    { resource: 'technicians', action: 'read' },
    { resource: 'technicians', action: 'update' },
    { resource: 'technicians', action: 'delete' },
    { resource: 'forms', action: 'create' },
    { resource: 'forms', action: 'read' },
    { resource: 'forms', action: 'update' },
    { resource: 'forms', action: 'delete' },
    { resource: 'forms', action: 'submit' },
    { resource: 'forms', action: 'view_responses' },
    { resource: 'groups', action: 'create' },
    { resource: 'groups', action: 'read' },
    { resource: 'groups', action: 'update' },
    { resource: 'groups', action: 'delete' },
    { resource: 'permissions', action: 'create' },
    { resource: 'permissions', action: 'read' },
    { resource: 'permissions', action: 'update' },
    { resource: 'permissions', action: 'delete' },
  ];

  console.log('🔐 Creating permissions...');
  const savedPermissions: Permission[] = [];
  for (const permData of permissions) {
    let permission = await permissionRepository.findOne({
      where: { resource: permData.resource, action: permData.action },
    });
    if (!permission) {
      permission = permissionRepository.create(permData);
      permission = await permissionRepository.save(permission);
    }
    savedPermissions.push(permission);
  }

  // Seed Groups
  const groups = [
    { name: 'Developers', permissions: savedPermissions },
    { 
      name: 'Project Managers', 
      permissions: savedPermissions.filter(p => 
        ['users', 'towers', 'technicians', 'forms'].includes(p.resource) && 
        p.action !== 'delete'
      )
    },
    { 
      name: 'Team Leaders', 
      permissions: savedPermissions.filter(p => 
        ['towers', 'technicians', 'forms'].includes(p.resource) && 
        ['read', 'create', 'update', 'submit', 'view_responses'].includes(p.action)
      )
    },
    { 
      name: 'Evaluators', 
      permissions: savedPermissions.filter(p => 
        (p.resource === 'towers' && p.action === 'read') ||
        (p.resource === 'technicians' && p.action === 'read') ||
        (p.resource === 'forms' && ['read', 'submit'].includes(p.action))
      )
    },
  ];

  console.log('👥 Creating groups...');
  const savedGroups: Group[] = [];
  for (const groupData of groups) {
    let group = await groupRepository.findOne({
      where: { name: groupData.name },
      relations: ['permissions'],
    });
    if (!group) {
      group = groupRepository.create({ name: groupData.name });
      group = await groupRepository.save(group);
      group.permissions = groupData.permissions;
      group = await groupRepository.save(group);
    }
    savedGroups.push(group);
  }

  // Seed Admin User
  const adminEmail = 'admin@telefonica.com';
  let adminUser = await userRepository.findOne({ where: { email: adminEmail } });
  
  if (!adminUser) {
    console.log('👤 Creating admin user...');
    const passwordHash = await bcrypt.hash('admin123', 10);
    const devRole = savedRoles.find(r => r.name === 'dev');
    
    adminUser = userRepository.create({
      name: 'System Administrator',
      email: adminEmail,
      passwordHash,
      roleId: devRole!.id,
      isActive: true,
    });
    
    adminUser = await userRepository.save(adminUser);
    
    // Assign all towers to admin
    adminUser.towers = savedTowers;
    
    // Assign admin group
    const adminGroup = savedGroups.find(g => g.name === 'Administrators');
    if (adminGroup) {
      adminUser.groups = [adminGroup];
    }
    
    await userRepository.save(adminUser);
  }

  // Seed PM User
  const pmEmail = 'pm@telefonica.com';
  let pmUser = await userRepository.findOne({ where: { email: pmEmail } });
  
  if (!pmUser) {
    console.log('👤 Creating PM user...');
    const passwordHash = await bcrypt.hash('pm123', 10);
    const pmRole = savedRoles.find(r => r.name === 'pm');
    
    pmUser = userRepository.create({
      name: 'Project Manager',
      email: pmEmail,
      passwordHash,
      roleId: pmRole!.id,
      isActive: true,
    });
    
    pmUser = await userRepository.save(pmUser);
    
    // Assign first two towers to PM
    pmUser.towers = savedTowers.slice(0, 2);
    
    // Assign PM group
    const pmGroup = savedGroups.find(g => g.name === 'Project Managers');
    if (pmGroup) {
      pmUser.groups = [pmGroup];
    }
    
    await userRepository.save(pmUser);
  }

  // Seed Evaluator User
  const evaluatorEmail = 'evaluador@telefonica.com';
  let evaluatorUser = await userRepository.findOne({ where: { email: evaluatorEmail } });
  
  if (!evaluatorUser) {
    console.log('👤 Creating evaluator user...');
    const passwordHash = await bcrypt.hash('eval123', 10);
    const evaluatorRole = savedRoles.find(r => r.name === 'evaluador');
    
    evaluatorUser = userRepository.create({
      name: 'Evaluador Test',
      email: evaluatorEmail,
      passwordHash,
      roleId: evaluatorRole!.id,
      isActive: true,
    });
    
    evaluatorUser = await userRepository.save(evaluatorUser);
    
    // Assign one tower to evaluator
    evaluatorUser.towers = [savedTowers[0]];
    
    // Assign evaluator group
    const evaluatorGroup = savedGroups.find(g => g.name === 'Evaluators');
    if (evaluatorGroup) {
      evaluatorUser.groups = [evaluatorGroup];
    }
    
    await userRepository.save(evaluatorUser);
  }

  console.log('✅ Database seeding completed!');
  console.log('');
  console.log('🔐 Default Users Created:');
  console.log('  Admin: admin@telefonica.com / admin123');
  console.log('  PM: pm@telefonica.com / pm123');
  console.log('  Evaluador: evaluador@telefonica.com / eval123');
}
