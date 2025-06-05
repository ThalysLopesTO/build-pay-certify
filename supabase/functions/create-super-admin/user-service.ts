
import { UserProfile } from './types.ts';

export async function findExistingUser(supabaseAdmin: any, email: string) {
  const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
  return existingUsers.users.find((user: any) => user.email === email);
}

export async function createAuthUser(supabaseAdmin: any, email: string, password: string, userRole: string, firstName: string, lastName: string) {
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true,
    user_metadata: {
      role: userRole,
      first_name: firstName,
      last_name: lastName
    }
  });

  if (authError) {
    console.error('Error creating auth user:', authError);
    throw new Error(authError.message);
  }

  if (!authUser.user?.id) {
    console.error('No user ID returned from auth creation');
    throw new Error('Failed to create user - no ID returned');
  }

  return authUser;
}

export async function checkExistingProfile(supabaseAdmin: any, userId: string) {
  const { data: profile, error: profileCheckError } = await supabaseAdmin
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (profileCheckError && profileCheckError.code !== 'PGRST116') {
    console.error('Error checking existing profile:', profileCheckError);
    throw new Error('Failed to check existing user profile');
  }

  return profile;
}

export async function updateUserProfile(supabaseAdmin: any, userId: string, companyId: string, role: string, firstName: string, lastName: string) {
  const { data: updatedProfile, error: profileError } = await supabaseAdmin
    .from('user_profiles')
    .update({
      first_name: firstName,
      last_name: lastName,
      company_id: companyId,
      role: role,
      pending_approval: false,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .select()
    .single();

  if (profileError) {
    console.error('Error updating profile:', profileError);
    throw new Error(`Failed to update user profile: ${profileError.message}`);
  }

  return updatedProfile;
}

export async function createUserProfile(supabaseAdmin: any, profileData: UserProfile) {
  console.log('Creating profile with data:', profileData);

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('user_profiles')
    .insert(profileData)
    .select()
    .single();

  if (profileError) {
    console.error('Error creating user profile:', profileError);
    throw new Error(`Failed to create user profile: ${profileError.message}`);
  }

  return profile;
}
