SELECT c.contentid AS "Page ID", c.title AS "Page Title", c.version, o.text_val
FROM CONTENT c, OS_PROPERTYENTRY o
WHERE c.prevver is NULL 
AND c.contentid=o.entity_id 
AND o.entity_key=concat('~metadata.',c.version)
AND o.text_val LIKE '%structured-macro ac:name=&quot;jira&quot;%'