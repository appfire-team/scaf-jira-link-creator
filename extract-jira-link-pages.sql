select
	c.contentid as "Page ID",
	c.title as "Page Title",
	c."version",
	op2.text_val
from
	os_propertyentry op2
inner join (
	select
		distinct(entity_id),
		max(entity_key) as "entity_key"
	from
		os_propertyentry op
	where
		op.entity_key like '~metadata.%'
        and op.text_val like '%structured-macro ac:name=&quot;jira&quot;%'
	group by
		entity_id) op3 on
	op2.entity_id = op3.entity_id
	and op2.entity_key = op3.entity_key
inner join "content" c on
	c.contentid = op2.entity_id