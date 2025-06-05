
export async function getOrCreateSuperAdminCompany(supabaseAdmin: any) {
  // Get or create the super admin company
  const { data: company, error: companyError } = await supabaseAdmin
    .from('companies')
    .select('id')
    .eq('name', 'Super Admin Company')
    .single();

  if (companyError) {
    console.log('Super Admin company not found, creating one...');
    const { data: newCompany, error: newCompanyError } = await supabaseAdmin
      .from('companies')
      .insert({
        name: 'Super Admin Company',
        status: 'active'
      })
      .select('id')
      .single();

    if (newCompanyError) {
      console.error('Error creating Super Admin company:', newCompanyError);
      throw new Error(`Failed to create Super Admin company: ${newCompanyError.message}`);
    }
    return newCompany.id;
  } else {
    return company.id;
  }
}
